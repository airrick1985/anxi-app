<template>
  <div class="pr-panel" :class="{ 'pr-panel--open': isOpen }">
    <!-- 摘要列 -->
    <div
      class="pr-summary"
      :class="{ 'pr-summary--toggle': collapsible }"
      :role="collapsible ? 'button' : undefined"
      :tabindex="collapsible ? 0 : undefined"
      :aria-expanded="collapsible ? isOpen : undefined"
      @click="toggleOpen"
      @keydown.enter.prevent="toggleOpen"
      @keydown.space.prevent="toggleOpen"
    >
      <div class="pr-stats">
        <div class="pr-stat">
          <span class="pr-stat-label">已繳</span>
          <span class="pr-stat-value pr-stat-value--strong">{{ formatMoney(summary.paidYuan) }} 元</span>
        </div>
        <div v-if="showRatio" class="pr-stat">
          <span class="pr-stat-label">繳款比例</span>
          <span class="pr-stat-value pr-stat-value--strong">{{ ratioText }}</span>
          <span v-if="ratioText === '—'" class="pr-stat-sub">未填成交總價</span>
        </div>
        <div class="pr-stat">
          <span class="pr-stat-label">待繳</span>
          <span class="pr-stat-value">{{ formatMoney(summary.pendingYuan) }} 元</span>
        </div>
        <div class="pr-stat">
          <span class="pr-stat-label">下次到期</span>
          <span class="pr-stat-value">{{ summary.next ? formatYmd(summary.next.record.expectedDate) : '—' }}</span>
          <span v-if="summary.next" class="mac-tag pr-stat-tag" :class="dueTagClass(summary.next.state)">{{ summary.next.label }}</span>
        </div>
      </div>
      <v-icon v-if="collapsible" size="20" class="pr-chevron">mdi-chevron-down</v-icon>
    </div>

    <div v-show="isOpen" class="pr-body">
      <!-- 新增 -->
      <div v-if="canAdd" class="pr-actions">
        <button type="button" class="mac-btn" @click="startAdd('planned')">
          <v-icon size="16" class="pr-icon-planned">mdi-calendar-plus</v-icon>預計繳款
        </button>
        <button type="button" class="mac-btn" @click="startAdd('paid')">
          <v-icon size="16" class="pr-icon-paid">mdi-check-circle-outline</v-icon>已繳款
        </button>
        <button v-if="canImportContract" type="button" class="mac-btn" @click="contractImportOpen = true">
          <v-icon size="16">mdi-file-import-outline</v-icon>帶入合約期款資料
        </button>
      </div>

      <!-- 預計繳款 -->
      <section class="pr-group pr-group--planned" aria-label="預計繳款">
        <header class="pr-group-head">
          <v-icon size="17" class="pr-icon-planned">mdi-calendar-clock</v-icon>
          <span class="pr-group-title">預計繳款</span>
          <span class="pr-group-count">{{ plannedRows.length }} 筆</span>
        </header>
        <div v-if="plannedRows.length === 0" class="pr-empty">尚無預計繳款</div>

        <template v-else-if="!editable">
          <div v-for="{ record: r } in plannedRows" :key="r.id" class="pr-row">
            <div class="pr-fields">
              <div class="pr-field">
                <span class="pr-field-label">預計日</span>
                <span class="pr-field-value">{{ formatYmd(r.expectedDate) }}</span>
              </div>
              <div class="pr-field">
                <span class="pr-field-label">預計金額</span>
                <span class="pr-field-value pr-num">{{ Number(r.expectedAmount) > 0 ? `${formatMoney(r.expectedAmount)} 元` : '未填' }}</span>
              </div>
              <div class="pr-field">
                <span class="pr-field-label">期別</span>
                <span class="pr-field-value">{{ r.period || '—' }}</span>
              </div>
              <div class="pr-field pr-field--note">
                <span class="pr-field-label">備註</span>
                <span class="pr-field-value">{{ r.note || '—' }}</span>
              </div>
            </div>
            <div class="pr-row-side">
              <span class="mac-tag" :class="dueTagClass(dueOf(r).state)">{{ dueOf(r).label }}</span>
              <button
                v-if="quickUpdateHandler"
                type="button"
                class="mac-btn mac-btn--sm mac-btn--primary"
                :disabled="busyId === r.id"
                @click="openMarkPaid(r)"
              >標記已繳</button>
              <v-menu v-if="hasRowMenu" location="bottom end" content-class="mac-menu">
                <template #activator="{ props: menuProps }">
                  <button v-bind="menuProps" type="button" class="mac-icon-btn pr-more" title="更多" aria-label="更多操作" :disabled="busyId === r.id">
                    <v-icon size="18">mdi-dots-horizontal</v-icon>
                  </button>
                </template>
                <v-list density="compact">
                  <v-list-item v-if="quickUpdateHandler" title="編輯" @click="openQuickEdit(r)" />
                  <v-list-item v-if="quickDeleteHandler" title="刪除" @click="confirmQuickDelete(r)" />
                </v-list>
              </v-menu>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-for="{ record: r, index } in plannedRows" :key="r.id || index" class="pr-edit-card">
            <div class="pr-edit-grid">
              <div>
                <span class="pr-label">預計日 *</span>
                <v-text-field aria-label="預計日" :model-value="r.expectedDate" type="date" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => update(index, 'expectedDate', v)" />
              </div>
              <div>
                <span class="pr-label">預計金額</span>
                <v-text-field aria-label="預計金額" :model-value="r.expectedAmount" type="number" min="1" inputmode="numeric" suffix="元" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => update(index, 'expectedAmount', amountInput(v))" />
              </div>
              <div>
                <span class="pr-label">期別</span>
                <PaymentPeriodField :model-value="editPeriodNote(r).period" :options="periodOptions"
                  @update:model-value="v => updatePeriodNote(index, 'period', v)" />
              </div>
              <div>
                <span class="pr-label">備註</span>
                <v-text-field aria-label="備註" :model-value="editPeriodNote(r).note" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => updatePeriodNote(index, 'note', v)" />
              </div>
            </div>
            <div class="pr-edit-foot">
              <span v-if="dueOf(r).label" class="mac-tag" :class="dueTagClass(dueOf(r).state)">{{ dueOf(r).label }}</span>
              <span class="mac-spacer"></span>
              <button type="button" class="mac-btn mac-btn--sm mac-btn--danger" @click="confirmRemove(index)">刪除</button>
              <button type="button" class="mac-btn mac-btn--sm mac-btn--primary" @click="openMarkPaid(r)">標記已繳</button>
            </div>
          </div>
        </template>
      </section>

      <!-- 已繳款 -->
      <section class="pr-group pr-group--paid" aria-label="已繳款">
        <header class="pr-group-head">
          <v-icon size="17" class="pr-icon-paid">mdi-check-circle</v-icon>
          <span class="pr-group-title">已繳款</span>
          <span class="pr-group-count">{{ paidRows.length }} 筆</span>
        </header>
        <div v-if="paidRows.length === 0" class="pr-empty">尚無繳款紀錄</div>

        <template v-else-if="!editable">
          <div v-for="{ record: r } in paidRows" :key="r.id" class="pr-row">
            <div class="pr-fields">
              <div class="pr-field">
                <span class="pr-field-label">繳款日</span>
                <span class="pr-field-value">{{ formatYmd(r.date) }}</span>
              </div>
              <div class="pr-field">
                <span class="pr-field-label">實繳金額</span>
                <span class="pr-field-value pr-num pr-field-value--strong">
                  <v-icon v-if="isPaidRecord(r)" size="14" class="pr-icon-paid">mdi-check</v-icon>{{ paidAmountText(r) }}
                </span>
              </div>
              <div class="pr-field">
                <span class="pr-field-label">期別</span>
                <span class="pr-field-value">{{ r.period || '—' }}</span>
              </div>
              <div class="pr-field pr-field--note">
                <span class="pr-field-label">備註</span>
                <span class="pr-field-value">{{ r.note || '—' }}</span>
                <span v-if="paidTimingNote(r)" class="pr-field-sub">{{ paidTimingNote(r) }}</span>
              </div>
            </div>
            <div class="pr-row-side">
              <v-img
                v-if="r.file"
                :src="thumbSrc(r)"
                width="44"
                height="44"
                cover
                class="pr-thumb rounded"
                @click.stop="openLightbox(r)"
              >
                <span v-if="isPdfRecord(r)" class="pr-pdf-badge">PDF</span>
                <template #error>
                  <div class="pr-thumb-fallback" @click.stop="openLightbox(r)">
                    <v-icon v-if="isPdfRecord(r)" size="26" color="red-darken-1">mdi-file-pdf-box</v-icon>
                    <v-icon v-else size="26" color="grey">mdi-file-image</v-icon>
                  </div>
                </template>
              </v-img>
              <v-menu v-if="hasRowMenu" location="bottom end" content-class="mac-menu">
                <template #activator="{ props: menuProps }">
                  <button v-bind="menuProps" type="button" class="mac-icon-btn pr-more" title="更多" aria-label="更多操作" :disabled="busyId === r.id">
                    <v-icon size="18">mdi-dots-horizontal</v-icon>
                  </button>
                </template>
                <v-list density="compact">
                  <v-list-item v-if="quickUpdateHandler" title="編輯" @click="openQuickEdit(r)" />
                  <v-list-item v-if="quickUpdateHandler && isValidYmd(r.expectedDate)" title="改回預計" @click="confirmRevert(r)" />
                  <v-list-item v-if="quickDeleteHandler" title="刪除" @click="confirmQuickDelete(r)" />
                </v-list>
              </v-menu>
            </div>
          </div>
        </template>

        <template v-else>
          <div
            v-for="{ record: r, index } in paidRows"
            :key="r.id || index"
            v-file-drop="driveFolderUrl ? { accept: PROOF_ACCEPT_ATTR, multiple: false, onFiles: files => applyFileToRecord(index, files[0]) } : false"
            class="pr-edit-card"
          >
            <div class="pr-edit-grid">
              <div>
                <span class="pr-label">繳款日 *</span>
                <v-text-field aria-label="繳款日" :model-value="r.date" type="date" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => update(index, 'date', v)" />
              </div>
              <div>
                <span class="pr-label">實繳金額 *</span>
                <v-text-field aria-label="實繳金額" :model-value="r.amount" type="number" min="1" inputmode="numeric" suffix="元" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => update(index, 'amount', amountInput(v))" />
              </div>
              <div>
                <span class="pr-label">期別</span>
                <PaymentPeriodField :model-value="editPeriodNote(r).period" :options="periodOptions"
                  @update:model-value="v => updatePeriodNote(index, 'period', v)" />
              </div>
              <div>
                <span class="pr-label">備註</span>
                <v-text-field aria-label="備註" :model-value="editPeriodNote(r).note" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => updatePeriodNote(index, 'note', v)" />
              </div>
              <div>
                <span class="pr-label">預計日</span>
                <v-text-field aria-label="預計日" :model-value="r.expectedDate" type="date" variant="solo" flat density="compact" hide-details class="mac-vfield"
                  @update:model-value="v => update(index, 'expectedDate', v)" />
              </div>
              <div class="pr-edit-wide">
                <span class="pr-label">憑證</span>
                <div v-if="!driveFolderUrl" class="pr-muted">未設定戶別資料夾，無法上傳</div>
                <template v-else>
                  <div v-if="r._pendingFile || r.file" class="pr-file">
                    <div v-if="r._pendingFile && isPdfRecord(r)" class="pr-pdf-tile pr-thumb rounded" @click.stop="openLightbox(r)">
                      <v-icon size="30" color="red-darken-1">mdi-file-pdf-box</v-icon>
                    </div>
                    <v-img v-else :src="editThumbSrc(r)" width="56" height="56" cover class="pr-thumb rounded" @click.stop="openLightbox(r)">
                      <span v-if="isPdfRecord(r)" class="pr-pdf-badge">PDF</span>
                      <template #error>
                        <div class="pr-thumb-fallback" @click.stop="openLightbox(r)">
                          <v-icon v-if="isPdfRecord(r)" size="28" color="red-darken-1">mdi-file-pdf-box</v-icon>
                          <v-icon v-else size="28" color="grey">mdi-file-image</v-icon>
                        </div>
                      </template>
                    </v-img>
                    <div class="pr-file-main">
                      <div class="pr-file-name">
                        <span v-if="r._pendingFile" class="mac-tag mac-tag--orange">待上傳</span>
                        <span>{{ r._pendingFile ? r._pendingFile.name : (r.file && r.file.fileName) }}</span>
                      </div>
                      <div class="pr-file-actions">
                        <button type="button" class="mac-btn mac-btn--sm" @click="triggerFileSelect(index)">更換</button>
                        <button v-if="r._pendingFile" type="button" class="mac-btn mac-btn--sm mac-btn--danger" @click="removePendingFile(index)">移除</button>
                      </div>
                    </div>
                  </div>
                  <button v-else type="button" class="mac-btn mac-btn--sm" @click="triggerFileSelect(index)">
                    <v-icon size="15">mdi-file-plus-outline</v-icon>選擇檔案
                  </button>
                  <div class="pr-muted pr-format">JPG、PNG、WEBP、PDF，10MB 內，儲存時上傳</div>
                </template>
              </div>
            </div>
            <div class="pr-edit-foot">
              <span v-if="paidTimingNote(r)" class="pr-field-sub">{{ paidTimingNote(r) }}</span>
              <span class="mac-spacer"></span>
              <button v-if="isValidYmd(r.expectedDate)" type="button" class="mac-btn mac-btn--sm" @click="confirmRevertLocal(index)">改回預計</button>
              <button type="button" class="mac-btn mac-btn--sm mac-btn--danger" @click="confirmRemove(index)">刪除</button>
            </div>
          </div>
          <input ref="fileInputRef" type="file" :accept="PROOF_ACCEPT_ATTR" class="d-none" @change="onFileSelected" />
        </template>
      </section>
    </div>
  </div>

  <!-- 新增／編輯（檢視模式，即時儲存） -->
  <v-dialog v-model="quick.open" max-width="520" persistent scrollable content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">{{ quick.kind === 'planned' ? 'mdi-calendar-clock' : 'mdi-check-circle-outline' }}</v-icon>
        <span class="pr-dialog-title">{{ quickTitle }}{{ unitId ? `（${unitId}）` : '' }}</span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="quick.saving" @click="closeQuick">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>
      <v-card-text v-file-drop="!!driveFolderUrl && !quick.saving && quick.kind === 'paid'" class="mac-form pr-dialog-body">
        <div v-if="quick.mode === 'add'" class="mac-form-seg mac-form-seg--block">
          <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': quick.kind === 'planned' }" @click="quick.kind = 'planned'">預計繳款</button>
          <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': quick.kind === 'paid' }" @click="quick.kind = 'paid'">已繳款</button>
        </div>

        <div v-if="quick.kind === 'planned'" class="mac-form-group mac-form-pad pr-dialog-grid">
          <div>
            <span class="pr-label">預計日 *</span>
            <v-text-field aria-label="預計日" v-model="quick.expectedDate" type="date" variant="solo" flat density="compact" hide-details class="mac-vfield" />
          </div>
          <div>
            <span class="pr-label">預計金額</span>
            <v-text-field aria-label="預計金額" v-model="quick.expectedAmount" type="number" min="1" inputmode="numeric" suffix="元" variant="solo" flat density="compact" hide-details class="mac-vfield" />
          </div>
          <div>
            <span class="pr-label">期別</span>
            <PaymentPeriodField v-model="quick.period" :options="periodOptions" />
          </div>
          <div>
            <span class="pr-label">備註</span>
            <v-text-field aria-label="備註" v-model="quick.note" variant="solo" flat density="compact" hide-details class="mac-vfield" />
          </div>
        </div>

        <template v-else>
          <div class="mac-form-group mac-form-pad pr-dialog-grid">
            <div>
              <span class="pr-label">繳款日 *</span>
              <v-text-field aria-label="繳款日" v-model="quick.date" type="date" variant="solo" flat density="compact" hide-details class="mac-vfield" />
            </div>
            <div>
              <span class="pr-label">實繳金額 *</span>
              <v-text-field aria-label="實繳金額" v-model="quick.amount" type="number" min="1" inputmode="numeric" suffix="元" variant="solo" flat density="compact" hide-details class="mac-vfield" />
            </div>
            <div>
              <span class="pr-label">期別</span>
              <PaymentPeriodField v-model="quick.period" :options="periodOptions" />
            </div>
            <div>
              <span class="pr-label">備註</span>
              <v-text-field aria-label="備註" v-model="quick.note" variant="solo" flat density="compact" hide-details class="mac-vfield" />
            </div>
            <div>
              <span class="pr-label">預計日</span>
              <v-text-field aria-label="預計日" v-model="quick.expectedDate" type="date" variant="solo" flat density="compact" hide-details class="mac-vfield" />
            </div>
          </div>

          <div class="mac-form-group mac-form-pad pr-proof">
            <span class="pr-label pr-proof-label">憑證</span>
            <div v-if="!driveFolderUrl" class="pr-muted">未設定戶別資料夾，無法上傳</div>
            <template v-else>
              <div v-if="quick.file" class="pr-file">
                <div v-if="isPdfLocalFile(quick.file)" class="pr-pdf-tile pr-thumb rounded" @click.stop="openRawLightbox(quick.previewUrl, quick.file.name, true)">
                  <v-icon size="30" color="red-darken-1">mdi-file-pdf-box</v-icon>
                </div>
                <v-img v-else :src="quick.previewUrl" width="56" height="56" cover class="pr-thumb rounded"
                  @click.stop="openRawLightbox(quick.previewUrl, quick.file.name)" />
                <div class="pr-file-main">
                  <div class="pr-file-name">
                    <span v-if="quick.mode === 'edit' && quick.existingFile" class="mac-tag mac-tag--orange">儲存後替換</span>
                    <span>{{ quick.file.name }}</span>
                  </div>
                  <div class="pr-file-actions">
                    <button type="button" class="mac-btn mac-btn--sm" @click="triggerQuickFileSelect">更換</button>
                    <button type="button" class="mac-btn mac-btn--sm mac-btn--danger" @click="removeQuickFile">移除</button>
                  </div>
                </div>
              </div>
              <div v-else-if="quick.existingFile && !quick.removeFile" class="pr-file">
                <v-img :src="driveThumb(quick.existingFile.fileId, 'w200')" width="56" height="56" cover class="pr-thumb rounded" @click.stop="openExistingFileLightbox">
                  <span v-if="isPdfFile(quick.existingFile)" class="pr-pdf-badge">PDF</span>
                  <template #error>
                    <div class="pr-thumb-fallback" @click.stop="openExistingFileLightbox">
                      <v-icon v-if="isPdfFile(quick.existingFile)" size="28" color="red-darken-1">mdi-file-pdf-box</v-icon>
                      <v-icon v-else size="28" color="grey">mdi-file-image</v-icon>
                    </div>
                  </template>
                </v-img>
                <div class="pr-file-main">
                  <div class="pr-file-name"><span>{{ quick.existingFile.fileName }}</span></div>
                  <div class="pr-file-actions">
                    <button type="button" class="mac-btn mac-btn--sm" @click="triggerQuickFileSelect">更換</button>
                    <button type="button" class="mac-btn mac-btn--sm mac-btn--danger" @click="quick.removeFile = true">移除</button>
                  </div>
                </div>
              </div>
              <div v-else-if="quick.existingFile && quick.removeFile" class="pr-file-removed">
                <span class="mac-tag mac-tag--red">儲存後移至垃圾桶</span>
                <button type="button" class="mac-btn mac-btn--sm" @click="quick.removeFile = false">復原</button>
                <button type="button" class="mac-btn mac-btn--sm" @click="triggerQuickFileSelect">選擇新檔案</button>
              </div>
              <button v-else type="button" class="mac-btn mac-btn--sm" @click="triggerQuickFileSelect">
                <v-icon size="15">mdi-file-plus-outline</v-icon>選擇檔案
              </button>
              <div class="pr-muted pr-format">JPG、PNG、WEBP、PDF，10MB 內</div>
            </template>
            <input ref="quickFileInputRef" type="file" :accept="PROOF_ACCEPT_ATTR" class="d-none" @change="onQuickFileSelected" />
          </div>
        </template>

        <div v-if="quick.error" class="mac-callout mac-callout--error pr-dialog-error">
          <v-icon size="16">mdi-alert-circle-outline</v-icon>
          <span>{{ quick.error }}</span>
        </div>
      </v-card-text>
      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="quick.saving" @click="closeQuick">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="quick.saving" @click="submitQuick">
          <v-progress-circular v-if="quick.saving" indeterminate size="14" width="2" />
          儲存
        </button>
      </div>
    </v-card>
  </v-dialog>

  <!-- 標記已繳 -->
  <MarkPaidDialog
    v-model="markPaid.open"
    :record="markPaid.record"
    :unit-id="unitId"
    :drive-folder-url="driveFolderUrl"
    :submit-handler="editable ? submitMarkPaidLocal : submitMarkPaidQuick"
  />

  <!-- 帶入合約期款資料 -->
  <PaymentContractImportDialog
    v-if="contractImportOpen"
    v-model="contractImportOpen"
    :project-id="projectId"
    :unit-data="unitData"
    :deal-total-wan="Number(totalPriceWan) || 0"
    :existing-records="records"
    :contract-doc-open="contractDocOpen"
    :submit-handler="submitContractPlans"
    @open-contract-doc="emit('open-contract-doc')"
  />

  <!-- 確認 -->
  <v-dialog v-model="confirmState.open" max-width="400" persistent content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
      <div class="mac-sheet-section pr-confirm-body">
        <div class="pr-confirm-title">{{ confirmState.title }}</div>
        <div v-if="confirmState.message" class="mac-sheet-note">{{ confirmState.message }}</div>
      </div>
      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="settleConfirm(false)">取消</button>
        <button type="button" class="mac-btn" :class="confirmState.danger ? 'mac-btn--danger-fill' : 'mac-btn--primary'" @click="settleConfirm(true)">{{ confirmState.confirmLabel }}</button>
      </div>
    </v-card>
  </v-dialog>

  <!-- 燈箱放大 -->
  <v-dialog v-model="lightbox.open" max-width="1000" content-class="mac-dialog-fit">
    <v-card class="pr-lightbox-card">
      <button type="button" class="pr-lightbox-close" title="關閉" @click.stop="lightbox.open = false">
        <v-icon size="20">mdi-close</v-icon>
      </button>
      <div v-if="lightbox.isPdf" class="pr-lightbox-pdf">
        <iframe
          :src="lightbox.src"
          class="pr-lightbox-pdf-frame"
          title="繳款憑證 PDF 預覽"
          allow="fullscreen"
          @load="lbView.loading = false"
        ></iframe>
        <div v-if="lbView.loading" class="pr-lightbox-loading">
          <v-progress-circular indeterminate color="grey"></v-progress-circular>
        </div>
      </div>
      <div
        v-else
        ref="lightboxStageRef"
        class="pr-lightbox-stage"
        :class="{ 'pr-lightbox-dragging': lbView.dragging }"
        @wheel.prevent="onLightboxWheel"
        @pointerdown="onLightboxPointerDown"
        @pointermove="onLightboxPointerMove"
        @pointerup="onLightboxPointerUp"
        @pointercancel="onLightboxPointerUp"
        @dblclick="onLightboxDblclick"
      >
        <img
          v-if="!lbView.error"
          :src="lightbox.src"
          :style="lightboxImgStyle"
          class="pr-lightbox-img"
          draggable="false"
          alt=""
          @load="lbView.loading = false"
          @error="lbView.loading = false; lbView.error = true"
        />
        <div v-if="lbView.error" class="pr-lightbox-error">
          <v-icon size="56" color="grey">mdi-image-off-outline</v-icon>
          <span>無法載入預覽圖</span>
        </div>
        <div v-else-if="lbView.loading" class="pr-lightbox-loading">
          <v-progress-circular indeterminate color="grey"></v-progress-circular>
        </div>
      </div>
      <div v-if="!lightbox.isPdf" class="pr-lightbox-toolbar" @click.stop>
        <button type="button" class="pr-lightbox-tool" title="縮小" @click="zoomLightboxAt(1 / 1.25)"><v-icon size="20">mdi-magnify-minus-outline</v-icon></button>
        <span class="pr-lightbox-zoom-label" title="重設檢視" @click="resetLightboxView">{{ Math.round(lbView.zoom * 100) }}%</span>
        <button type="button" class="pr-lightbox-tool" title="放大" @click="zoomLightboxAt(1.25)"><v-icon size="20">mdi-magnify-plus-outline</v-icon></button>
        <span class="pr-lightbox-divider"></span>
        <button type="button" class="pr-lightbox-tool" title="向左旋轉" @click="lbView.rotate -= 90"><v-icon size="20">mdi-rotate-left</v-icon></button>
        <button type="button" class="pr-lightbox-tool" title="向右旋轉" @click="lbView.rotate += 90"><v-icon size="20">mdi-rotate-right</v-icon></button>
        <button type="button" class="pr-lightbox-tool" title="重設檢視" @click="resetLightboxView"><v-icon size="20">mdi-backup-restore</v-icon></button>
      </div>
      <div class="pr-lightbox-foot" @click.stop>
        <span class="pr-lightbox-name">{{ lightbox.name }}</span>
        <a v-if="lightbox.webViewLink" class="mac-btn mac-btn--sm" :href="lightbox.webViewLink" target="_blank" rel="noopener">
          <v-icon size="15">mdi-google-drive</v-icon>在 Drive 開啟
        </a>
        <a v-else-if="lightbox.isPdf" class="mac-btn mac-btn--sm" :href="lightbox.src" target="_blank" rel="noopener">
          <v-icon size="15">mdi-open-in-new</v-icon>新分頁開啟
        </a>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useToast, POSITION } from 'vue-toastification';
import {
  isPaidRecord,
  isValidYmd,
  paidTimingNote,
  recordDueState,
  splitPaymentRecords,
  summarizePaymentRecords,
  taipeiToday,
} from '@/utils/paymentRecordStatus';
import { splitPeriodAndNote } from '@/utils/contractPaymentPlan';
import { usePaymentPeriodOptions } from '@/composables/usePaymentPeriodOptions';
import MarkPaidDialog from './payment/MarkPaidDialog.vue';
import PaymentPeriodField from './payment/PaymentPeriodField.vue';
import { paymentRowKind as rowKind } from './payment/paymentEditRow';
import {
  PROOF_ACCEPT_ATTR,
  isPdfFile,
  isPdfLocalFile,
  proofFileError,
} from './payment/paymentProofFile';

const PaymentContractImportDialog = defineAsyncComponent(() => import('./payment/PaymentContractImportDialog.vue'));

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },
  totalPriceWan: { type: [Number, String], default: null }, // 成交總價（萬）
  unitId: { type: String, default: '' },
  driveFolderUrl: { type: String, default: '' },
  allowQuickAdd: { type: Boolean, default: false }, // 檢視模式是否可新增（即時儲存）
  quickAddHandler: { type: Function, default: null }, // async ({ date, amount, note, file, expectedDate, expectedAmount, planSource, silent })
  quickUpdateHandler: { type: Function, default: null }, // async ({ recordId, date, amount, note, file, removeFile, expectedDate, expectedAmount, planSource, silent })
  quickDeleteHandler: { type: Function, default: null }, // async ({ recordId })
  defaultExpanded: { type: Boolean, default: false }, // 預設展開（不可收合）；否則摘要列可收合
  showRatio: { type: Boolean, default: true },
  projectId: { type: String, default: '' },
  unitData: { type: Object, default: null },
  contractDocOpen: { type: Boolean, default: false }, // 合約製作設定是否開著，關閉時帶入視窗重新讀取
});
const emit = defineEmits(['update:modelValue', 'plans-saved', 'open-contract-doc']);

const toast = useToast();

const records = computed(() => props.modelValue || []);
const today = taipeiToday();

const {
  options: periodOptions,
  load: loadPeriodOptions,
  ready: periodOptionsReady,
} = usePaymentPeriodOptions(() => ({ projectId: props.projectId, unitId: props.unitId, unitData: props.unitData }));
onMounted(loadPeriodOptions);
// 合約製作設定存檔後，這戶的期別可能變了
watch(() => props.contractDocOpen, (open, wasOpen) => {
  if (wasOpen && !open) loadPeriodOptions();
});
const summary = computed(() => summarizePaymentRecords(records.value, today));

const collapsible = computed(() => !props.defaultExpanded);
const manuallyOpen = ref(false);
const isOpen = computed(() => props.defaultExpanded || manuallyOpen.value);
function toggleOpen() {
  if (collapsible.value) manuallyOpen.value = !manuallyOpen.value;
}

const ratioText = computed(() => {
  const totalWan = Number(props.totalPriceWan);
  if (!totalWan || Number.isNaN(totalWan)) return '—';
  return `${((summary.value.paidYuan / (totalWan * 10000)) * 100).toFixed(1)}%`;
});

const plannedRows = computed(() => {
  if (props.editable) {
    return records.value.map((record, index) => ({ record, index })).filter(row => rowKind(row.record) === 'planned');
  }
  return splitPaymentRecords(records.value).planned.map(record => ({ record, index: records.value.indexOf(record) }));
});
const paidRows = computed(() => {
  if (props.editable) {
    return records.value.map((record, index) => ({ record, index })).filter(row => rowKind(row.record) === 'paid');
  }
  return splitPaymentRecords(records.value).paid.map(record => ({ record, index: records.value.indexOf(record) }));
});

function dueOf(record) {
  return recordDueState(record, today);
}

function dueTagClass(state) {
  return {
    overdue: 'mac-tag--red',
    today: 'mac-tag--orange-fill',
    soon: 'mac-tag--orange',
    paid: 'mac-tag--green',
  }[state] || '';
}

const canAdd = computed(() => props.editable || (props.allowQuickAdd && typeof props.quickAddHandler === 'function'));
const hasRowMenu = computed(() => typeof props.quickUpdateHandler === 'function' || typeof props.quickDeleteHandler === 'function');
const canImportContract = computed(() => !props.editable && canAdd.value
  && typeof props.quickUpdateHandler === 'function' && !!props.projectId && !!props.unitData);

function startAdd(kind) {
  if (props.editable) addRow(kind);
  else openQuickAdd(kind);
}

// ── 確認對話框 ──
const confirmState = reactive({ open: false, title: '', message: '', confirmLabel: '確定', danger: false });
let confirmResolver = null;
function askConfirm({ title, message = '', confirmLabel = '確定', danger = false }) {
  Object.assign(confirmState, { open: true, title, message, confirmLabel, danger });
  return new Promise((resolve) => { confirmResolver = resolve; });
}
function settleConfirm(value) {
  confirmState.open = false;
  confirmResolver?.(value);
  confirmResolver = null;
}

// ── 縮圖來源 ──
function driveThumb(fileId, size) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}
function thumbSrc(r) {
  return r.file ? driveThumb(r.file.fileId, 'w200') : '';
}
function editThumbSrc(r) {
  if (r._pendingPreviewUrl) return r._pendingPreviewUrl;
  return thumbSrc(r);
}
// Drive 內嵌預覽（PDF 用；Drive 自帶翻頁／縮放／下載）
function drivePreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
function isPdfRecord(r) {
  if (r._pendingFile) return isPdfLocalFile(r._pendingFile);
  return isPdfFile(r.file);
}

// ── 新增／編輯（檢視模式，即時儲存；上傳與寫入由父層 handler 執行）──
const quickFileInputRef = ref(null);
const quick = reactive({
  open: false,
  saving: false,
  mode: 'add',
  kind: 'planned',
  recordId: '',
  date: '',
  amount: null,
  period: '',
  note: '',
  expectedDate: '',
  expectedAmount: null,
  file: null,
  previewUrl: '',
  existingFile: null,
  removeFile: false,
  error: '',
});
const busyId = ref('');

const quickTitle = computed(() => {
  if (quick.mode === 'add') return '新增繳款紀錄';
  return quick.kind === 'planned' ? '編輯預計繳款' : '編輯繳款紀錄';
});

function openQuickAdd(kind) {
  removeQuickFile();
  Object.assign(quick, {
    open: true,
    saving: false,
    mode: 'add',
    kind,
    recordId: '',
    date: taipeiToday(),
    amount: null,
    period: '',
    note: '',
    expectedDate: '',
    expectedAmount: null,
    existingFile: null,
    removeFile: false,
    error: '',
  });
}
async function openQuickEdit(r) {
  removeQuickFile();
  // 舊資料的備註等於期別名稱時，編輯畫面視為該期別，存檔後才真的分開
  const { period, note } = splitPeriodAndNote(r, await periodOptionsReady());
  Object.assign(quick, {
    open: true,
    saving: false,
    mode: 'edit',
    kind: rowKind(r),
    recordId: r.id,
    date: r.date || '',
    amount: r.amount,
    period,
    note,
    expectedDate: r.expectedDate || '',
    expectedAmount: r.expectedAmount ?? null,
    existingFile: r.file || null,
    removeFile: false,
    error: '',
  });
}
function closeQuick() {
  if (quick.saving) return;
  removeQuickFile();
  quick.open = false;
}
function openExistingFileLightbox() {
  const f = quick.existingFile;
  if (!f) return;
  const isPdf = isPdfFile(f);
  const src = isPdf ? drivePreviewUrl(f.fileId) : driveThumb(f.fileId, 'w1600');
  prepareLightbox(src, isPdf);
  lightbox.src = src;
  lightbox.name = f.fileName || '';
  lightbox.webViewLink = f.webViewLink || '';
  lightbox.open = true;
}
function triggerQuickFileSelect() {
  if (!quickFileInputRef.value) return;
  quickFileInputRef.value.value = '';
  quickFileInputRef.value.click();
}
function onQuickFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const message = proofFileError(file);
  if (message) {
    quick.error = message;
    return;
  }
  quick.error = '';
  if (quick.previewUrl) URL.revokeObjectURL(quick.previewUrl);
  quick.file = file;
  quick.previewUrl = URL.createObjectURL(file);
  quick.removeFile = false; // 選了新檔即取代「移除」標記
}
function removeQuickFile() {
  if (quick.previewUrl) URL.revokeObjectURL(quick.previewUrl);
  quick.file = null;
  quick.previewUrl = '';
}

function buildQuickPayload() {
  const note = String(quick.note || '');
  const period = String(quick.period || '').trim();
  if (quick.kind === 'planned') {
    if (!isValidYmd(quick.expectedDate)) throw new Error('請選擇預計日');
    const expectedAmount = parsePositiveInt(quick.expectedAmount);
    if (Number.isNaN(expectedAmount)) throw new Error('預計金額須為大於 0 的整數');
    return {
      date: '',
      amount: null,
      period,
      note,
      file: null,
      removeFile: false,
      expectedDate: quick.expectedDate,
      expectedAmount,
      ...(quick.mode === 'add' ? { planSource: 'manual' } : {}),
    };
  }
  if (!isValidYmd(quick.date)) throw new Error('請選擇繳款日');
  const amount = parsePositiveInt(quick.amount);
  if (amount === null || Number.isNaN(amount)) throw new Error('實繳金額須為大於 0 的整數');
  // 已繳表單看不到預計金額，不送出：新增不帶、編輯保留後端原值
  return {
    date: quick.date,
    amount,
    period,
    note,
    file: quick.file,
    removeFile: quick.mode === 'edit' && quick.removeFile,
    expectedDate: isValidYmd(quick.expectedDate) ? quick.expectedDate : null,
  };
}

async function submitQuick() {
  const isEdit = quick.mode === 'edit';
  const handler = isEdit ? props.quickUpdateHandler : props.quickAddHandler;
  if (typeof handler !== 'function') return;
  quick.saving = true;
  quick.error = '';
  try {
    await handler({ ...buildQuickPayload(), ...(isEdit ? { recordId: quick.recordId } : {}) });
    removeQuickFile();
    quick.open = false;
  } catch (error) {
    quick.error = error.message || '請稍後再試';
  } finally {
    quick.saving = false;
  }
}

async function confirmQuickDelete(r) {
  if (typeof props.quickDeleteHandler !== 'function') return;
  const hasFile = !!(r.file && r.file.fileId);
  const confirmed = await askConfirm({
    title: '確定刪除這筆紀錄？',
    message: hasFile ? '憑證檔案會一併移至垃圾桶。' : '',
    confirmLabel: '刪除',
    danger: true,
  });
  if (!confirmed) return;
  busyId.value = r.id;
  try {
    await props.quickDeleteHandler({ recordId: r.id });
  } catch (error) {
    toast.error(`刪除失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busyId.value = '';
  }
}

async function confirmRevert(r) {
  const hasFile = !!(r.file && r.file.fileId);
  const confirmed = await askConfirm({
    title: '改回預計繳款？',
    message: hasFile ? '實繳內容會清除，憑證檔案移至垃圾桶。' : '實繳內容會清除。',
    confirmLabel: '改回預計',
    danger: true,
  });
  if (!confirmed) return;
  busyId.value = r.id;
  try {
    await props.quickUpdateHandler({
      recordId: r.id,
      date: '',
      amount: null,
      note: r.note || '',
      file: null,
      removeFile: true,
    });
  } catch (error) {
    toast.error(`操作失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busyId.value = '';
  }
}

// ── 標記已繳 ──
const markPaid = reactive({ open: false, record: null });
function openMarkPaid(r) {
  markPaid.record = r;
  markPaid.open = true;
}

async function submitMarkPaidQuick({ record, date, amount, note, file, balancePlan }) {
  await props.quickUpdateHandler({
    recordId: record.id,
    date,
    amount,
    note,
    file,
    removeFile: false,
    silent: true,
  });
  if (balancePlan) {
    try {
      await props.quickAddHandler({
        date: '',
        amount: null,
        ...(balancePlan.period ? { period: balancePlan.period } : {}),
        note: balancePlan.note,
        file: null,
        expectedDate: balancePlan.expectedDate,
        expectedAmount: balancePlan.expectedAmount,
        planSource: 'balance',
        silent: true,
      });
    } catch (error) {
      // 這筆已標記已繳，差額失敗不重新送出，避免對話框重試時重複操作
      toast.warning(`已標記已繳，但差額新增失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  }
  emit('plans-saved');
  toast.success('已標記已繳', { position: POSITION.BOTTOM_CENTER });
}

function newRow(kind, fields = {}) {
  const nowIso = new Date().toISOString();
  return {
    id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    _kind: kind,
    date: kind === 'paid' ? taipeiToday() : '',
    amount: null,
    period: '',
    note: '',
    file: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...(kind === 'planned' ? { expectedDate: '', expectedAmount: null, planSource: 'manual' } : {}),
    ...fields,
  };
}

function submitMarkPaidLocal({ record, date, amount, note, file, balancePlan }) {
  const nowIso = new Date().toISOString();
  const next = records.value.map((r) => {
    if (r !== record && r.id !== record.id) return r;
    return {
      ...r,
      _kind: 'paid',
      _markedPaid: true, // 儲存時據此寫入 paidAt、paidBy，不會進 Firestore
      date,
      amount,
      note,
      updatedAt: nowIso,
      ...(file ? { _pendingFile: file, _pendingPreviewUrl: URL.createObjectURL(file) } : {}),
    };
  });
  if (balancePlan) {
    next.push(newRow('planned', {
      expectedDate: balancePlan.expectedDate,
      expectedAmount: balancePlan.expectedAmount,
      period: balancePlan.period || '',
      note: balancePlan.note,
      planSource: 'balance',
    }));
  }
  commit(next);
}

// ── 帶入合約期款資料 ──
const contractImportOpen = ref(false);
async function submitContractPlans(plans, { onPlanSaved } = {}) {
  // 逐筆寫入，先標已繳款的期別再寫預計；中途失敗不會還原已寫入的筆數，以 onPlanSaved 回報成功筆數，錯誤由對話框顯示
  let savedCount = 0;
  try {
    for (const plan of plans) {
      if (plan.kind === 'assign') {
        await props.quickUpdateHandler({
          recordId: plan.recordId, date: plan.date, amount: plan.amount, period: plan.period, note: plan.note, file: null, removeFile: false, silent: true,
        });
      } else {
        const fields = {
          date: '', amount: null, note: plan.note, file: null, expectedDate: plan.expectedDate, expectedAmount: plan.expectedAmount, silent: true,
        };
        if (plan.kind === 'update') await props.quickUpdateHandler({ ...fields, recordId: plan.recordId, removeFile: false });
        else await props.quickAddHandler({ ...fields, period: plan.period, planSource: 'contract' });
      }
      savedCount += 1;
      onPlanSaved?.(plan);
    }
  } finally {
    if (savedCount > 0) emit('plans-saved');
  }
  const countOf = kind => plans.filter(plan => plan.kind === kind).length;
  const planParts = [
    countOf('add') && `新增 ${countOf('add')} 筆`,
    countOf('update') && `更新 ${countOf('update')} 筆`,
  ].filter(Boolean);
  const parts = [
    countOf('assign') && `對應 ${countOf('assign')} 筆已繳款`,
    planParts.length && `${planParts.join('、')}預計繳款`,
  ].filter(Boolean);
  toast.success(`已${parts.join('、')}`, { position: POSITION.BOTTOM_CENTER });
}

// ── 燈箱 ──
const lightbox = reactive({ open: false, src: '', name: '', webViewLink: '', isPdf: false });
const lbView = reactive({ zoom: 1, rotate: 0, panX: 0, panY: 0, loading: true, error: false, dragging: false });
const lightboxStageRef = ref(null);
const lightboxImgStyle = computed(() => ({
  transform: `translate(${lbView.panX}px, ${lbView.panY}px) scale(${lbView.zoom}) rotate(${lbView.rotate}deg)`,
}));
function resetLightboxView() {
  lbView.zoom = 1;
  lbView.rotate = 0;
  lbView.panX = 0;
  lbView.panY = 0;
}
function clampZoom(z) {
  return Math.min(8, Math.max(0.2, z));
}
// 以指定螢幕座標為錨點縮放（未給座標則以畫面中心）
function zoomLightboxAt(factor, clientX = null, clientY = null) {
  const oldZoom = lbView.zoom;
  const newZoom = clampZoom(oldZoom * factor);
  if (newZoom === oldZoom) return;
  const stage = lightboxStageRef.value;
  if (stage && clientX != null) {
    const rect = stage.getBoundingClientRect();
    const px = clientX - rect.left - rect.width / 2;
    const py = clientY - rect.top - rect.height / 2;
    const ratio = newZoom / oldZoom;
    lbView.panX = px - ratio * (px - lbView.panX);
    lbView.panY = py - ratio * (py - lbView.panY);
  }
  lbView.zoom = newZoom;
}
function onLightboxWheel(e) {
  zoomLightboxAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
}
function onLightboxDblclick(e) {
  if (lbView.zoom !== 1 || lbView.panX || lbView.panY) resetLightboxView();
  else zoomLightboxAt(2.5, e.clientX, e.clientY);
}
// 單指拖曳平移、雙指捏合縮放
const lbPointers = new Map();
let lbPanStart = null;
let lbPinchStart = null;
function lbPointerDist() {
  const pts = [...lbPointers.values()];
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
}
function onLightboxPointerDown(e) {
  e.currentTarget.setPointerCapture?.(e.pointerId);
  lbPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lbPointers.size === 1) {
    lbPanStart = { x: e.clientX, y: e.clientY, panX: lbView.panX, panY: lbView.panY };
    lbView.dragging = true;
  } else if (lbPointers.size === 2) {
    lbPanStart = null;
    lbPinchStart = { dist: lbPointerDist(), zoom: lbView.zoom };
  }
}
function onLightboxPointerMove(e) {
  if (!lbPointers.has(e.pointerId)) return;
  lbPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lbPointers.size === 2 && lbPinchStart) {
    lbView.zoom = clampZoom(lbPinchStart.zoom * (lbPointerDist() / lbPinchStart.dist));
  } else if (lbPointers.size === 1 && lbPanStart) {
    lbView.panX = lbPanStart.panX + (e.clientX - lbPanStart.x);
    lbView.panY = lbPanStart.panY + (e.clientY - lbPanStart.y);
  }
}
function onLightboxPointerUp(e) {
  lbPointers.delete(e.pointerId);
  if (lbPointers.size < 2) lbPinchStart = null;
  if (lbPointers.size === 0) {
    lbPanStart = null;
    lbView.dragging = false;
  } else if (lbPointers.size === 1) {
    const p = [...lbPointers.values()][0];
    lbPanStart = { x: p.x, y: p.y, panX: lbView.panX, panY: lbView.panY };
  }
}
function prepareLightbox(newSrc, isPdf = false) {
  resetLightboxView();
  // 同一來源重開時 <img>／<iframe> 不會再觸發 load 事件（v-dialog 內容關閉後仍保留），只有換來源才顯示 loading
  lbView.loading = newSrc !== lightbox.src;
  lbView.error = false;
  lightbox.isPdf = isPdf;
  lbPointers.clear();
  lbPanStart = null;
  lbPinchStart = null;
}
function openRawLightbox(src, name, isPdf = false) {
  prepareLightbox(src, isPdf);
  lightbox.src = src;
  lightbox.name = name || '';
  lightbox.webViewLink = '';
  lightbox.open = true;
}
function openLightbox(r) {
  let src;
  if (r._pendingPreviewUrl) {
    src = r._pendingPreviewUrl;
    prepareLightbox(src, isPdfLocalFile(r._pendingFile));
    lightbox.name = r._pendingFile ? r._pendingFile.name : '';
    lightbox.webViewLink = '';
  } else if (r.file) {
    const isPdf = isPdfFile(r.file);
    src = isPdf ? drivePreviewUrl(r.file.fileId) : driveThumb(r.file.fileId, 'w1600');
    prepareLightbox(src, isPdf);
    lightbox.name = r.file.fileName || '';
    lightbox.webViewLink = r.file.webViewLink || '';
  } else {
    return;
  }
  lightbox.src = src;
  lightbox.open = true;
}

// ── 編輯模式：emit 整個陣列（不就地改 props）──
const fileInputRef = ref(null);
const pendingSelectIdx = ref(-1);

function commit(next) {
  emit('update:modelValue', next);
}
function update(idx, key, value) {
  const nowIso = new Date().toISOString();
  commit(records.value.map((r, i) => (i === idx ? { ...r, _kind: rowKind(r), [key]: value, updatedAt: nowIso } : r)));
}
// 舊資料的備註等於期別名稱時，編輯畫面視為該期別；動到其中一欄才真的分開
function editPeriodNote(record) {
  return splitPeriodAndNote(record, periodOptions.value);
}
function updatePeriodNote(idx, key, value) {
  const nowIso = new Date().toISOString();
  commit(records.value.map((r, i) => (i === idx
    ? { ...r, _kind: rowKind(r), ...splitPeriodAndNote(r, periodOptions.value), [key]: value, updatedAt: nowIso }
    : r)));
}
function addRow(kind) {
  manuallyOpen.value = true;
  commit([...records.value, newRow(kind)]);
}
async function confirmRemove(idx) {
  const target = records.value[idx];
  const hasFile = !!(target && target.file && target.file.fileId);
  const confirmed = await askConfirm({
    title: '確定刪除這筆紀錄？',
    message: hasFile ? '儲存後憑證檔案會移至垃圾桶。' : '',
    confirmLabel: '刪除',
    danger: true,
  });
  if (!confirmed) return;
  if (target && target._pendingPreviewUrl) URL.revokeObjectURL(target._pendingPreviewUrl);
  commit(records.value.filter((_, i) => i !== idx));
}
async function confirmRevertLocal(idx) {
  const target = records.value[idx];
  const hasFile = !!(target?.file?.fileId || target?._pendingFile);
  const confirmed = await askConfirm({
    title: '改回預計繳款？',
    message: hasFile ? '實繳內容會清除，儲存後憑證檔案移至垃圾桶。' : '實繳內容會清除。',
    confirmLabel: '改回預計',
    danger: true,
  });
  if (!confirmed) return;
  if (target?._pendingPreviewUrl) URL.revokeObjectURL(target._pendingPreviewUrl);
  const nowIso = new Date().toISOString();
  commit(records.value.map((r, i) => {
    if (i !== idx) return r;
    const { _pendingFile, _pendingPreviewUrl, _markedPaid, ...rest } = r;
    return { ...rest, _kind: 'planned', date: '', amount: null, file: null, paidAt: null, paidBy: null, updatedAt: nowIso };
  }));
}

function triggerFileSelect(idx) {
  pendingSelectIdx.value = idx;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}
function onFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  const idx = pendingSelectIdx.value;
  pendingSelectIdx.value = -1;
  if (!file || idx < 0) return;
  applyFileToRecord(idx, file);
}
// 將本地檔案掛到第 idx 筆紀錄（點選或拖曳皆走此處；按儲存時才由父層上傳）
function applyFileToRecord(idx, file) {
  if (!file || idx < 0 || idx >= records.value.length) return;
  const message = proofFileError(file);
  if (message) {
    toast.error(message, { position: POSITION.BOTTOM_CENTER });
    return;
  }
  const nowIso = new Date().toISOString();
  commit(records.value.map((r, i) => {
    if (i !== idx) return r;
    if (r._pendingPreviewUrl) URL.revokeObjectURL(r._pendingPreviewUrl);
    return {
      ...r,
      _kind: rowKind(r),
      _pendingFile: file,
      _pendingPreviewUrl: URL.createObjectURL(file),
      updatedAt: nowIso,
    };
  }));
}
function removePendingFile(idx) {
  commit(records.value.map((r, i) => {
    if (i !== idx) return r;
    if (r._pendingPreviewUrl) URL.revokeObjectURL(r._pendingPreviewUrl);
    const { _pendingFile, _pendingPreviewUrl, ...rest } = r;
    return rest;
  }));
}

onBeforeUnmount(() => {
  records.value.forEach((r) => {
    if (r._pendingPreviewUrl) URL.revokeObjectURL(r._pendingPreviewUrl);
  });
  if (quick.previewUrl) URL.revokeObjectURL(quick.previewUrl);
  settleConfirm(false);
});

// ── 工具 ──
// 編輯模式不自動四捨五入，儲存時才驗證；空白為 null，輸入途中不是完整數字（如 100.）時保留原字串
function amountInput(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return String(n) === String(v) ? n : v;
}
// 空白回傳 null；不是正整數回傳 NaN，由呼叫端提示
function parsePositiveInt(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : NaN;
}
function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('zh-TW');
}
function paidAmountText(r) {
  return Number(r.amount) > 0 ? `${formatMoney(r.amount)} 元` : '—';
}
function formatYmd(value) {
  return isValidYmd(value) ? String(value).replace(/-/g, '/') : '—';
}
</script>

<style scoped>
.pr-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  font-size: 13px;
}
.pr-icon-planned { color: #0071e3; }
.pr-icon-paid { color: #248a3d; }

/* ── 摘要列 ── */
.pr-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 0.5px 1.5px rgba(0, 0, 0, 0.05);
}
.pr-summary--toggle { cursor: pointer; }
.pr-summary--toggle:hover { background: #fafafa; }
.pr-summary--toggle:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.4); outline-offset: 2px; }
.pr-stats {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  gap: 10px 16px;
}
.pr-stat { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; }
.pr-stat-label { font-size: 11.5px; font-weight: 600; color: #6e6e73; }
.pr-stat-value { font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.pr-stat-value--strong { font-weight: 700; }
.pr-stat-sub { font-size: 11.5px; color: #8e8e93; }
.pr-stat-tag { margin-top: 1px; }
.pr-chevron { flex: 0 0 auto; color: #8e8e93; transition: transform 0.15s; }
.pr-panel--open .pr-chevron { transform: rotate(180deg); }

.pr-body { display: flex; flex-direction: column; gap: 10px; }
.pr-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }

/* ── 分區 ── */
.pr-group {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 0.5px 1.5px rgba(0, 0, 0, 0.05);
}
/* 灰階下仍可分辨：預計虛線、已繳實線 */
.pr-group--planned { border-left: 3px dashed #0071e3; }
.pr-group--paid { border-left: 3px solid #248a3d; }
.pr-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 6px 14px;
}
.pr-group--planned .pr-group-head { background: rgba(0, 113, 227, 0.07); }
.pr-group--paid .pr-group-head { background: rgba(52, 199, 89, 0.1); }
.pr-group-title { font-size: 13.5px; font-weight: 700; }
.pr-group--planned .pr-group-title { color: #0058b0; }
.pr-group--paid .pr-group-title { color: #1f7a36; }
.pr-group-count { font-size: 12px; color: #6e6e73; }
.pr-empty { padding: 10px 14px; font-size: 12.5px; color: #8e8e93; }

/* ── 檢視列 ── */
.pr-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  padding: 10px 14px;
}
.pr-row + .pr-row, .pr-group-head + .pr-row { border-top: 1px solid #ececf0; }
.pr-fields {
  flex: 1 1 280px;
  min-width: 0;
  display: grid;
  grid-template-columns: 96px 124px minmax(0, 0.8fr) minmax(0, 1fr);
  gap: 6px 12px;
}
.pr-field { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.pr-field-label { font-size: 11px; font-weight: 600; color: #8e8e93; }
.pr-field-value { font-size: 13.5px; overflow-wrap: anywhere; }
.pr-field-value--strong { font-weight: 700; }
.pr-field-sub { font-size: 11.5px; color: #6e6e73; }
.pr-num { font-variant-numeric: tabular-nums; }
.pr-row-side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
.pr-more { width: 30px; height: 30px; }

/* ── 編輯卡片 ── */
.pr-edit-card { padding: 12px 14px; }
.pr-edit-card + .pr-edit-card, .pr-group-head + .pr-edit-card { border-top: 1px solid #ececf0; }
.pr-edit-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.pr-edit-wide { grid-column: 1 / -1; }
.pr-edit-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
.pr-edit-foot .mac-spacer { flex: 1 1 auto; }
.pr-label { display: block; margin: 0 0 4px 2px; font-size: 12px; font-weight: 600; color: #6e6e73; }
.pr-muted { font-size: 12px; color: #6e6e73; }
.pr-format { margin-top: 6px; }

/* ── 憑證 ── */
.pr-file { display: flex; align-items: center; gap: 12px; }
.pr-file-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pr-file-name { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 12.5px; overflow-wrap: anywhere; }
.pr-file-actions { display: flex; gap: 6px; }
.pr-file-removed { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pr-thumb {
  position: relative;
  cursor: zoom-in;
  border: 1px solid rgba(0, 0, 0, 0.14);
  flex: 0 0 auto;
}
.pr-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
  background: #f5f5f7;
}
.pr-pdf-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #fff5f5;
}
.pr-pdf-badge {
  position: absolute;
  right: 2px;
  bottom: 2px;
  padding: 0 4px;
  border-radius: 3px;
  background: #d32f2f;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 14px;
  pointer-events: none;
}

/* ── 對話框 ── */
.pr-dialog-title { min-width: 0; overflow-wrap: anywhere; }
.pr-dialog-body { display: flex; flex-direction: column; gap: 10px; padding: 12px 16px !important; }
.pr-dialog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.pr-proof { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.pr-proof-label { margin: 0; }
.pr-dialog-error { margin: 0; }
.pr-confirm-body { display: flex; flex-direction: column; gap: 6px; padding: 18px 16px; }
.pr-confirm-title { font-size: 15px; font-weight: 600; }

/* ── 燈箱 ── */
.pr-lightbox-card {
  position: relative;
  border-radius: 14px !important;
  background: #141416;
}
.pr-lightbox-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #1d1d1f;
  cursor: pointer;
}
.pr-lightbox-stage {
  position: relative;
  height: 72vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}
.pr-lightbox-stage.pr-lightbox-dragging { cursor: grabbing; }
.pr-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.15s ease;
  will-change: transform;
  pointer-events: none;
}
.pr-lightbox-dragging .pr-lightbox-img { transition: none; }
.pr-lightbox-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.pr-lightbox-error { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #aeaeb2; font-size: 12.5px; }
.pr-lightbox-pdf { position: relative; height: 80vh; background: #333; }
.pr-lightbox-pdf-frame { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
.pr-lightbox-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 8px 0;
}
.pr-lightbox-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #d1d1d6;
  cursor: pointer;
}
.pr-lightbox-tool:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
.pr-lightbox-zoom-label { min-width: 44px; font-size: 12px; color: #d1d1d6; text-align: center; cursor: pointer; }
.pr-lightbox-divider { width: 1px; height: 18px; margin: 0 4px; background: rgba(255, 255, 255, 0.28); }
.pr-lightbox-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  padding: 10px 14px 12px;
}
.pr-lightbox-name { min-width: 0; color: #d1d1d6; font-size: 12px; overflow-wrap: anywhere; text-align: center; }

@media (max-width: 600px) {
  .pr-fields { flex-basis: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pr-edit-grid, .pr-dialog-grid { grid-template-columns: minmax(0, 1fr); }
  .pr-actions { justify-content: stretch; }
  .pr-actions .mac-btn { flex: 1 1 auto; }
}
</style>
