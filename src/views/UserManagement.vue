<template>
  <div class="mac-page um-page">
    <!-- 標題列：右側主要動作依分頁切換 -->
    <div class="mac-page-bar um-bar">
      <div class="mac-page-title">
        <span class="mac-page-title-main">人員管理</span>
        <span v-if="tabCountText" class="mac-page-count">{{ tabCountText }}</span>
      </div>
      <div class="mac-page-actions">
        <button type="button" class="mac-icon-btn" title="重新整理" :disabled="refreshing || adminStore.isLoading" @click="refresh">
          <v-icon size="18" :class="{ 'um-spin': refreshing }">mdi-refresh</v-icon>
        </button>
        <template v-if="['users', 'projects'].includes(currentTab)">
          <button v-if="canBatchGrant" type="button" class="mac-btn" @click="openBatchGrantDialog">
            <v-icon size="16">mdi-account-multiple-plus-outline</v-icon><span>批次授權</span>
          </button>
          <button type="button" class="mac-btn mac-btn--primary" @click="openCreateDialog()">
            <v-icon size="16">mdi-plus</v-icon><span>新增人員</span>
          </button>
        </template>
        <button v-else-if="currentTab === 'roles'" type="button" class="mac-btn mac-btn--primary" @click="createNewRole">
          <v-icon size="16">mdi-plus</v-icon><span>新增角色</span>
        </button>
        <button v-else-if="currentTab === 'functions'" type="button" class="mac-btn mac-btn--primary" @click="openFunctionDialog()">
          <v-icon size="16">mdi-plus</v-icon><span>新增權限功能</span>
        </button>
      </div>
    </div>

    <!-- 分頁切換 -->
    <div class="um-tabs">
      <div class="mac-form-seg" :class="{ 'mac-form-seg--block': !mdAndUp }">
        <button
          v-for="tab in tabOptions"
          :key="tab.value"
          type="button"
          class="mac-form-seg-btn"
          :class="{ 'is-active': currentTab === tab.value }"
          @click="currentTab = tab.value"
        >{{ tab.label }}</button>
      </div>
    </div>

    <!-- 搜尋＋狀態篩選 -->
    <div v-if="['users', 'projects'].includes(currentTab)" class="mac-searchbar um-searchbar">
      <v-text-field
        v-model="searchPhone"
        variant="solo"
        flat
        density="compact"
        hide-details
        clearable
        class="mac-vfield mac-vfield--search"
        prepend-inner-icon="mdi-magnify"
        placeholder="搜尋姓名、手機、公司、建案"
      ></v-text-field>
      <div v-if="currentTab === 'users'" class="mac-form-seg um-status-seg">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          class="mac-form-seg-btn"
          :class="{ 'is-active': statusFilter === option.value }"
          @click="statusFilter = option.value"
        >{{ option.label }}<span class="um-seg-count">{{ option.count }}</span></button>
      </div>
    </div>

    <div v-if="errorMessage && showErrorAlert" class="um-error">
      <div class="mac-callout mac-callout--error">
        <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ errorMessage }}</span>
      </div>
      <button type="button" class="mac-btn" @click="loadInitialData()">重試</button>
    </div>

    <div v-if="adminStore.isLoading" class="mac-list-loading">
      <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
    </div>

    <template v-else>
      <!-- ===== 人員 ===== -->
      <template v-if="currentTab === 'users'">
        <v-data-table
          v-if="mdAndUp"
          class="mac-table um-table"
          :headers="tableHeaders"
          :items="filteredUsers"
          item-value="phone"
          :items-per-page="25"
          :items-per-page-options="[25, 50, 100, { value: -1, title: '全部' }]"
          :row-props="userRowProps"
          no-data-text="找不到符合條件的人員"
          items-per-page-text="每頁筆數"
          :page-text="'{0}-{1} / 共 {2} 筆'"
        >
          <template v-slot:item.name="{ item }">
            <button type="button" class="um-person" title="編輯" @click="openEditDialog(item.phone)">
              <span class="um-avatar">{{ initialOf(item.name) }}</span>
              <span class="um-person-text">
                <span class="um-person-name">{{ item.name }}<span v-if="item.phone === selfKey" class="mac-tag mac-tag--blue">我</span></span>
                <span v-if="item.email" class="um-person-sub">{{ item.email }}</span>
              </span>
            </button>
          </template>
          <template v-slot:item.companyName="{ item }">
            <span v-if="item.companyName">{{ item.companyName }}</span>
            <span v-else class="mac-form-empty">—</span>
          </template>
          <template v-slot:item.lineId="{ item }">
            <span class="mac-tag" :class="lineMetaOf(item).tagClass">{{ lineMetaOf(item).label }}</span>
          </template>
          <template v-slot:item.projects="{ item }">
            <div class="um-tags" :title="item.projects.length > PROJECT_TAG_LIMIT ? item.projects.join('、') : undefined">
              <span v-for="project in item.projects.slice(0, PROJECT_TAG_LIMIT)" :key="project" class="mac-tag">{{ project }}</span>
              <span v-if="item.projects.length > PROJECT_TAG_LIMIT" class="mac-tag um-tag-more">+{{ item.projects.length - PROJECT_TAG_LIMIT }}</span>
              <span v-if="item.projects.length === 0" class="mac-form-empty">—</span>
            </div>
          </template>
          <template v-slot:item.roles="{ item }">
            <button
              type="button"
              class="um-role-btn"
              :disabled="item.phone === selfKey"
              :title="item.phone === selfKey ? '不可變更自己的角色' : '指派角色'"
              @click="openRoleMenu($event, item)"
            >
              <span v-for="role in item.roles" :key="role" class="mac-tag mac-tag--blue">{{ role }}</span>
              <span v-if="!item.roles || item.roles.length === 0" class="mac-form-empty">未指派</span>
              <v-icon v-if="item.phone !== selfKey" size="14" class="um-role-caret">mdi-chevron-down</v-icon>
            </button>
          </template>
          <template v-slot:item.disabled="{ item }">
            <div class="um-status">
              <input
                v-if="canViewAndEditRoles"
                type="checkbox"
                class="mac-switch"
                :checked="!item.disabled"
                :disabled="!!statusLockReason(item) || !!statusSaving[item.phone]"
                :title="statusLockReason(item) || (item.disabled ? '啟用帳號' : '停用帳號')"
                :aria-label="`${item.name} 帳號啟用`"
                @change="toggleAccountStatus(item, $event)"
              >
              <span class="mac-tag" :class="item.disabled ? 'mac-tag--red' : 'mac-tag--green'">{{ item.disabled ? '已停用' : '啟用中' }}</span>
            </div>
          </template>
          <template v-slot:item.actions="{ item }">
            <div class="um-actions">
              <button
                v-if="isSuperAdmin && lineStateOf(item) !== 'none'"
                type="button"
                class="mac-icon-btn um-unlink"
                title="解除 LINE 綁定"
                @click="openUnbindLineDialog(item)"
              ><v-icon size="17">mdi-link-variant-off</v-icon></button>
              <button v-if="canViewAndEditRoles" type="button" class="mac-icon-btn" title="寄送通知信" @click="openEmailDialog(item)">
                <v-icon size="17">mdi-email-outline</v-icon>
              </button>
              <button type="button" class="mac-icon-btn" title="編輯" @click="openEditDialog(item.phone)">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </button>
            </div>
          </template>
        </v-data-table>

        <!-- 手機：清單列，點列編輯、右側開關一鍵停用／啟用 -->
        <div v-else class="mac-list um-list">
          <div
            v-for="item in filteredUsers"
            :key="item.phone"
            class="mac-list-row um-user-row"
            :class="{ 'is-off': item.disabled }"
            role="button"
            tabindex="0"
            @click="openEditDialog(item.phone)"
            @keydown.enter="openEditDialog(item.phone)"
          >
            <span class="um-avatar">{{ initialOf(item.name) }}</span>
            <div class="mac-list-main">
              <div class="mac-list-line1">
                <span class="mac-list-title">{{ item.name }}</span>
                <span v-if="item.disabled" class="mac-tag mac-tag--red">已停用</span>
              </div>
              <div class="mac-list-meta">{{ item.phone }}<template v-if="item.companyName">・{{ item.companyName }}</template></div>
              <div class="um-tags">
                <span class="mac-tag" :class="lineMetaOf(item).tagClass">LINE {{ lineMetaOf(item).label }}</span>
                <span v-for="role in item.roles" :key="role" class="mac-tag mac-tag--blue">{{ role }}</span>
              </div>
              <div v-if="item.projects.length" class="mac-list-preview">{{ item.projects.join('、') }}</div>
            </div>
            <div v-if="canViewAndEditRoles" class="um-row-side" @click.stop>
              <input
                type="checkbox"
                class="mac-switch"
                :checked="!item.disabled"
                :disabled="!!statusLockReason(item) || !!statusSaving[item.phone]"
                :aria-label="`${item.name} 帳號啟用`"
                @change="toggleAccountStatus(item, $event)"
              >
            </div>
            <v-icon v-else size="18" class="um-row-chevron">mdi-chevron-right</v-icon>
          </div>
          <div v-if="filteredUsers.length === 0" class="mac-list-empty">找不到符合條件的人員</div>
        </div>
      </template>

      <!-- ===== 建案 ===== -->
      <template v-else-if="currentTab === 'projects'">
        <div v-if="groupedProjects.length === 0" class="mac-list-empty">找不到符合條件的建案或人員</div>
        <div v-else class="um-split">
          <aside v-if="mdAndUp" class="um-sidebar">
            <button
              v-for="group in groupedProjects"
              :key="group.id"
              type="button"
              class="um-side-item"
              :class="{ 'is-active': group.id === activeProjectGroup.id }"
              @click="selectedProjectId = group.id"
            >
              <span class="um-side-name">{{ group.name }}</span>
              <span class="um-side-count">{{ group.users.length }}</span>
            </button>
          </aside>
          <section class="um-detail">
            <v-select
              v-if="!mdAndUp"
              :model-value="activeProjectGroup.id"
              :items="groupedProjects"
              item-title="name"
              item-value="id"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="mac-vfield um-detail-select"
              :menu-props="{ contentClass: 'mac-menu' }"
              @update:model-value="selectedProjectId = $event"
            ></v-select>
            <div class="um-detail-head">
              <span class="um-detail-title">{{ activeProjectGroup.name }}</span>
              <span class="mac-page-count">{{ activeProjectGroup.users.length }} 人</span>
            </div>
            <div class="mac-form-group">
              <div v-for="user in activeProjectGroup.users" :key="user.phone" class="um-member" :class="{ 'is-off': user.disabled }">
                <button type="button" class="um-person um-member-person" title="編輯" @click="openEditDialog(user.phone)">
                  <span class="um-avatar">{{ initialOf(user.name) }}</span>
                  <span class="um-person-text">
                    <span class="um-person-name">{{ user.name }}<span v-if="user.disabled" class="mac-tag mac-tag--red">已停用</span></span>
                    <span class="um-person-sub">{{ user.phone }}</span>
                  </span>
                </button>
                <div class="um-member-perms">
                  <div
                    v-for="category in getGroupedUserPermissions(user.projectSystems)"
                    :key="category.id"
                    class="um-perm-line"
                    :style="{ '--um-tone': category.tone }"
                  >
                    <span class="um-perm-cat"><v-icon size="13">{{ category.icon }}</v-icon>{{ category.label }}</span>
                    <span v-for="sys in category.permissions" :key="sys" class="mac-tag um-perm-tag">{{ sys }}</span>
                  </div>
                  <span v-if="user.projectSystems.length === 0" class="mac-form-empty">無權限</span>
                </div>
                <div class="um-actions">
                  <button v-if="canViewAndEditRoles" type="button" class="mac-icon-btn" title="寄送通知信" @click="openEmailDialog(user)">
                    <v-icon size="17">mdi-email-outline</v-icon>
                  </button>
                  <button type="button" class="mac-icon-btn" title="編輯" @click="openEditDialog(user.phone)">
                    <v-icon size="17">mdi-pencil-outline</v-icon>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>

      <!-- ===== 角色 ===== -->
      <template v-else-if="currentTab === 'roles' && isSuperAdmin">
        <div class="um-split">
          <aside v-if="mdAndUp" class="um-sidebar">
            <button
              v-for="(role, index) in adminStore.roles"
              :key="role.id"
              type="button"
              class="um-side-item"
              :class="{ 'is-active': selectedRoleIndex === index }"
              @click="selectedRoleIndex = index"
            >
              <span class="um-side-name">{{ role.name }}</span>
            </button>
          </aside>
          <section class="um-detail um-detail--form mac-form">
            <v-select
              v-if="!mdAndUp"
              v-model="selectedRoleIndex"
              :items="adminStore.roles.map((role, index) => ({ title: role.name, value: index }))"
              variant="solo"
              flat
              density="compact"
              hide-details
              placeholder="選擇角色"
              class="mac-vfield um-detail-select"
              :menu-props="{ contentClass: 'mac-menu' }"
            ></v-select>

            <template v-if="selectedRole">
              <div class="mac-form-label">基本設定</div>
              <div class="mac-form-group">
                <div class="mac-form-row">
                  <span class="mac-form-row-label">角色名稱</span>
                  <input
                    v-model="selectedRole.name"
                    type="text"
                    class="mac-form-input"
                    :readonly="isBuiltInRole"
                    aria-label="角色名稱"
                  >
                </div>
                <div class="mac-form-row um-row-wrap">
                  <span class="mac-form-row-label">可指派的角色</span>
                  <v-select
                    v-model="selectedRole.grantableRoles"
                    :items="allRoleNames"
                    multiple
                    chips
                    closable-chips
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    placeholder="未設定"
                    class="mac-vfield um-grow"
                    :menu-props="{ contentClass: 'mac-menu' }"
                  ></v-select>
                </div>
              </div>

              <div class="mac-form-label">人員管理欄位權限</div>
              <div class="mac-form-group">
                <div v-for="field in userManagementFields" :key="field.key" class="mac-form-row um-row-wrap">
                  <span class="mac-form-row-label">{{ field.label }}</span>
                  <div class="mac-form-seg um-field-seg">
                    <button
                      v-for="option in fieldPermissionOptions"
                      :key="option.value"
                      type="button"
                      class="mac-form-seg-btn"
                      :class="{ 'is-active': selectedRole.fieldPermissions.UserManagement[field.key] === option.value }"
                      @click="selectedRole.fieldPermissions.UserManagement[field.key] = option.value"
                    >{{ option.title }}</button>
                  </div>
                </div>
              </div>

              <div class="um-detail-foot">
                <button v-if="!isBuiltInRole" type="button" class="mac-btn mac-btn--danger" @click="confirmDeleteRole(selectedRole)">
                  <v-icon size="16">mdi-trash-can-outline</v-icon><span>刪除角色</span>
                </button>
                <span class="mac-spacer"></span>
                <button type="button" class="mac-btn mac-btn--primary" :disabled="savingRole" @click="saveRole">
                  {{ savingRole ? '儲存中…' : '儲存' }}
                </button>
              </div>
            </template>
            <div v-else class="mac-list-empty">選擇角色</div>
          </section>
        </div>
      </template>

      <!-- ===== 權限功能 ===== -->
      <template v-else-if="currentTab === 'functions' && isSuperAdmin">
        <v-data-table
          v-if="mdAndUp"
          class="mac-table um-table"
          :headers="functionTableHeaders"
          :items="adminStore.systemFunctions"
          item-value="functionId"
          :items-per-page="25"
          :items-per-page-options="[25, 50, 100, { value: -1, title: '全部' }]"
          no-data-text="沒有權限功能資料"
          items-per-page-text="每頁筆數"
          :page-text="'{0}-{1} / 共 {2} 筆'"
        >
          <template v-slot:item.name="{ item }">
            <span class="um-fn-name">{{ item.name }}</span>
          </template>
          <template v-slot:item.functionId="{ item }">
            <code class="um-code">{{ item.functionId }}</code>
          </template>
          <template v-slot:item.description="{ item }">
            <span v-if="item.description" class="um-fn-desc">{{ item.description }}</span>
            <span v-else class="mac-form-empty">—</span>
          </template>
          <template v-slot:item.isCore="{ value }">
            <span v-if="value" class="mac-tag mac-tag--red">核心</span>
            <span v-else class="mac-form-empty">—</span>
          </template>
          <template v-slot:item.quotaSummary="{ item }">
            <div v-if="item.quotaPerProject && Object.keys(item.quotaPerProject).length > 0" class="um-tags">
              <span v-for="(limit, projectId) in item.quotaPerProject" :key="projectId" class="mac-tag">
                {{ projectStore.idToNameMap[projectId] || projectId }} {{ limit }} 人
              </span>
            </div>
            <span v-else class="mac-form-empty">不限</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <div class="um-actions">
              <button type="button" class="mac-icon-btn" title="編輯" @click="openFunctionDialog(item)">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </button>
            </div>
          </template>
        </v-data-table>

        <div v-else class="mac-list um-list">
          <button
            v-for="item in adminStore.systemFunctions"
            :key="item.functionId"
            type="button"
            class="mac-list-row"
            @click="openFunctionDialog(item)"
          >
            <div class="mac-list-main">
              <div class="mac-list-line1">
                <span class="mac-list-title">{{ item.name }}</span>
                <span v-if="item.isCore" class="mac-tag mac-tag--red">核心</span>
              </div>
              <div class="mac-list-meta">{{ item.functionId }}</div>
              <div v-if="item.description" class="mac-list-meta">{{ item.description }}</div>
              <div v-if="item.quotaPerProject && Object.keys(item.quotaPerProject).length > 0" class="um-tags">
                <span v-for="(limit, projectId) in item.quotaPerProject" :key="projectId" class="mac-tag">
                  {{ projectStore.idToNameMap[projectId] || projectId }} {{ limit }} 人
                </span>
              </div>
            </div>
            <v-icon size="18" class="um-row-chevron">mdi-chevron-right</v-icon>
          </button>
          <div v-if="adminStore.systemFunctions.length === 0" class="mac-list-empty">沒有權限功能資料</div>
        </div>
      </template>
    </template>

    <!-- 角色指派選單：整頁共用一個 -->
    <v-menu
      v-model="roleMenu.open"
      :activator="roleMenu.activator || undefined"
      :close-on-content-click="false"
      location="bottom start"
      offset="4"
    >
      <div class="um-pop">
        <div class="mac-sheet-label">{{ roleMenuUser?.name }} 的角色</div>
        <label
          v-for="option in roleMenuOptions"
          :key="option.name"
          class="um-check-row"
          :class="{ 'is-disabled': option.locked || roleMenuUser?.rolesLoading }"
        >
          <input
            type="checkbox"
            class="mac-check"
            :checked="(roleMenuUser?.roles || []).includes(option.name)"
            :disabled="option.locked || roleMenuUser?.rolesLoading"
            @change="toggleRole(option.name)"
          >
          <span class="um-check-text">{{ option.name }}</span>
        </label>
        <div v-if="roleMenuOptions.length === 0" class="mac-form-empty um-pop-empty">沒有可指派的角色</div>
      </div>
    </v-menu>

    <!-- ===== 新增／編輯人員 ===== -->
    <v-dialog
      v-model="dialogVisible"
      persistent
      scrollable
      :fullscreen="!mdAndUp"
      :max-width="mdAndUp ? 1080 : undefined"
    >
      <v-card class="mac-sheet um-sheet" :class="{ 'um-sheet--full': !mdAndUp, 'um-sheet--tall': mdAndUp }">
        <div class="mac-sheet-head">
          <span>{{ isNewUser ? '新增人員' : '編輯人員' }}</span>
          <span v-if="!isNewUser && !loadingDetails && targetAccount.disabled" class="mac-tag mac-tag--red">已停用</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="closeDialog"><v-icon size="18">mdi-close</v-icon></button>
        </div>

        <div class="um-sheet-body mac-form">
          <div v-if="loadingDetails" class="mac-list-loading">
            <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
          </div>

          <div v-else-if="targetUser" class="um-edit" :class="{ 'um-edit--single': getFieldPermission('permissions') === 'H' }">
            <!-- 左欄：基本資料＋帳號 -->
            <div class="um-edit-side">
              <v-form ref="basicInfoForm" v-model="isFormValid">
                <div class="mac-form-label um-label-first">基本資料</div>
                <div class="mac-form-group mac-form-pad um-fields">
                  <div v-if="getFieldPermission('phone') !== 'H'" class="um-field">
                    <label class="mac-sheet-label">手機號碼（登入帳號）</label>
                    <v-text-field
                      v-model="targetUser.basicInfo.phone"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      inputmode="tel"
                      :rules="rules.required"
                      :readonly="!isNewUser"
                      :loading="phoneValidationLoading"
                      :error-messages="phoneValidationError"
                      :messages="phoneValidationSuccess"
                      :hide-details="isNewUser ? false : 'auto'"
                      @blur="validatePhoneNumber"
                    ></v-text-field>
                  </div>
                  <div v-if="getFieldPermission('name') !== 'H'" class="um-field">
                    <label class="mac-sheet-label">姓名</label>
                    <v-text-field
                      v-model="targetUser.basicInfo.name"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      hide-details="auto"
                      :rules="rules.required"
                      :readonly="getFieldPermission('name') === 'R'"
                    ></v-text-field>
                  </div>
                  <div v-if="getFieldPermission('email') !== 'H'" class="um-field">
                    <label class="mac-sheet-label">Email</label>
                    <v-text-field
                      v-model="targetUser.basicInfo.email"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      hide-details="auto"
                      inputmode="email"
                      :readonly="getFieldPermission('email') === 'R'"
                    ></v-text-field>
                  </div>
                  <div v-if="getFieldPermission('password') !== 'H'" class="um-field">
                    <label class="mac-sheet-label">密碼</label>
                    <v-text-field
                      v-if="!isNewUser && getFieldPermission('password') === 'C'"
                      model-value="********"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      hide-details
                      readonly
                    ></v-text-field>
                    <v-text-field
                      v-else
                      v-model="targetUser.basicInfo.password"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      hide-details="auto"
                      :rules="isNewUser ? rules.required : []"
                      :readonly="getFieldPermission('password') === 'R'"
                      :placeholder="isNewUser ? '' : '不修改請留空'"
                    ></v-text-field>
                  </div>
                  <div v-if="getFieldPermission('companyName') !== 'H'" class="um-field">
                    <label class="mac-sheet-label">公司名稱</label>
                    <v-text-field
                      v-model="targetUser.basicInfo.companyName"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      hide-details="auto"
                      :readonly="getFieldPermission('companyName') === 'R'"
                    ></v-text-field>
                  </div>
                  <div v-if="getFieldPermission('companyTaxId') !== 'H'" class="um-field">
                    <label class="mac-sheet-label">統一編號</label>
                    <v-text-field
                      v-model="targetUser.basicInfo.companyTaxId"
                      variant="solo"
                      flat
                      density="compact"
                      class="mac-vfield"
                      hide-details="auto"
                      inputmode="numeric"
                      :readonly="getFieldPermission('companyTaxId') === 'R'"
                    ></v-text-field>
                  </div>
                </div>

                <div v-if="isSuperAdmin" class="mac-form-group um-group-gap">
                  <label class="mac-form-row um-switch-row">
                    <span class="mac-form-row-main">
                      <span class="mac-form-row-title">允許重複登入</span>
                      <span class="um-row-sub">多個裝置可同時登入</span>
                    </span>
                    <input v-model="targetUser.basicInfo.allowMultiLogin" type="checkbox" class="mac-switch">
                  </label>
                </div>
              </v-form>

              <template v-if="!isNewUser">
                <div class="mac-form-label">帳號</div>
                <div class="mac-form-group">
                  <label class="mac-form-row um-switch-row">
                    <span class="mac-form-row-main">
                      <span class="mac-form-row-title">帳號狀態</span>
                      <span class="um-row-sub" :class="{ 'is-danger': targetAccount.disabled }">{{ accountStatusText }}</span>
                    </span>
                    <input
                      type="checkbox"
                      class="mac-switch"
                      :checked="!targetAccount.disabled"
                      :disabled="!!targetStatusLockReason || !!statusSaving[targetUser.basicInfo.phone]"
                      :title="targetStatusLockReason || undefined"
                      aria-label="帳號啟用"
                      @change="toggleTargetAccountStatus($event)"
                    >
                  </label>
                  <div v-if="canViewAndEditRoles && editingListUser" class="mac-form-row">
                    <span class="mac-form-row-main">
                      <span class="mac-form-row-title">角色</span>
                    </span>
                    <button
                      type="button"
                      class="um-role-btn um-role-btn--end"
                      :disabled="editingListUser.phone === selfKey"
                      :title="editingListUser.phone === selfKey ? '不可變更自己的角色' : '指派角色'"
                      @click="openRoleMenu($event, editingListUser)"
                    >
                      <span v-for="role in editingListUser.roles" :key="role" class="mac-tag mac-tag--blue">{{ role }}</span>
                      <span v-if="!editingListUser.roles || editingListUser.roles.length === 0" class="mac-form-empty">未指派</span>
                      <v-icon v-if="editingListUser.phone !== selfKey" size="14" class="um-role-caret">mdi-chevron-down</v-icon>
                    </button>
                  </div>
                  <div class="mac-form-row">
                    <span class="mac-form-row-main">
                      <span class="mac-form-row-title">LINE</span>
                    </span>
                    <span class="mac-tag" :class="lineMetaOf(targetAccount).tagClass">{{ lineMetaOf(targetAccount).label }}</span>
                    <button
                      v-if="isSuperAdmin && lineStateOf(targetAccount) !== 'none'"
                      type="button"
                      class="mac-btn mac-btn--sm mac-btn--danger"
                      @click="openUnbindLineDialog({ phone: targetUser.basicInfo.phone, name: targetUser.basicInfo.name })"
                    >解除綁定</button>
                  </div>
                  <button
                    v-if="canViewAndEditRoles"
                    type="button"
                    class="mac-form-row mac-form-link um-link-row"
                    @click="openEmailDialog({ phone: targetUser.basicInfo.phone })"
                  >
                    <span class="mac-form-row-main"><span class="mac-form-row-title">寄送通知信</span></span>
                    <v-icon size="18" class="um-row-chevron">mdi-chevron-right</v-icon>
                  </button>
                </div>
              </template>
            </div>

            <!-- 右欄：系統權限 -->
            <div v-if="getFieldPermission('permissions') !== 'H'" class="um-edit-main">
              <div class="mac-form-label um-label-first">
                <span>系統權限</span>
                <span class="mac-spacer"></span>
                <button type="button" class="mac-link-btn" @click="expandAll">全部展開</button>
                <button type="button" class="mac-link-btn" @click="collapseAll">全部收合</button>
              </div>
              <v-text-field
                v-model="projectSearchQuery"
                variant="solo"
                flat
                density="compact"
                hide-details
                clearable
                class="mac-vfield mac-vfield--search um-panel-search"
                prepend-inner-icon="mdi-magnify"
                placeholder="搜尋建案"
              ></v-text-field>

              <div v-if="permissionMatrix" class="um-panels">
                <div v-for="project in editProjects" :key="project" class="mac-form-group um-panel">
                  <div class="um-panel-head" role="button" tabindex="0" @click="togglePanel(project)" @keydown.enter="togglePanel(project)">
                    <input
                      type="checkbox"
                      class="mac-check"
                      :checked="isAllSelectedForProject(project)"
                      :indeterminate.prop="isIndeterminateForProject(project)"
                      :disabled="isProjectToggleDisabled(project)"
                      :aria-label="`${project} 全選`"
                      @click.stop
                      @change="onProjectToggleChange(project, $event)"
                    >
                    <span class="um-panel-name">{{ project }}</span>
                    <span v-if="projectSelectedCount(project) > 0" class="mac-filter-count">{{ projectSelectedCount(project) }}</span>
                    <v-icon size="18" class="um-chevron" :class="{ 'is-open': isPanelOpen(project) }">mdi-chevron-right</v-icon>
                  </div>
                  <div v-if="isPanelOpen(project)" class="um-panel-body">
                    <div v-for="group in groupedPermissions" :key="group.id" class="um-perm-group" :style="{ '--um-tone': group.tone }">
                      <div class="um-perm-cat"><v-icon size="13">{{ group.icon }}</v-icon>{{ group.label }}</div>
                      <div class="um-perm-grid">
                        <label
                          v-for="system in group.items"
                          :key="system"
                          class="um-check-row"
                          :class="{ 'is-disabled': isPermissionDisabled(system, project) }"
                          :title="functionDescriptionMap[system] || undefined"
                        >
                          <input
                            type="checkbox"
                            class="mac-check"
                            :checked="!!permissionMatrix[system]?.[project]"
                            :disabled="isPermissionDisabled(system, project)"
                            @change="onPermissionChange(system, project, $event)"
                          >
                          <span class="um-check-text">
                            {{ system }}
                            <small
                              v-if="getQuotaLimit(system, project) > 0"
                              class="um-quota"
                              :class="{ 'is-full': isQuotaFull(system, project) && !permissionMatrix[system]?.[project] }"
                            >名額 {{ getQuotaUsed(system, project) }}/{{ getQuotaLimit(system, project) }}</small>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="editProjects.length === 0" class="mac-list-empty">找不到符合條件的建案</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--lg" @click="closeDialog">取消</button>
          <button
            type="button"
            class="mac-btn mac-btn--primary mac-btn--lg"
            :disabled="saving || loadingDetails || !isFormValid"
            @click="handleSave"
          >{{ saving ? '儲存中…' : (isNewUser ? '建立人員' : '儲存') }}</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- ===== 批次授權 ===== -->
    <v-dialog
      v-model="batchDialogVisible"
      persistent
      scrollable
      :fullscreen="!mdAndUp"
      :max-width="mdAndUp ? 1080 : undefined"
    >
      <v-card class="mac-sheet um-sheet" :class="{ 'um-sheet--full': !mdAndUp, 'um-sheet--tall': mdAndUp && !batchResult }">
        <div class="mac-sheet-head">
          <span>批次授權</span>
          <button type="button" class="mac-sheet-close" title="關閉" :disabled="batchSaving" @click="closeBatchDialog"><v-icon size="18">mdi-close</v-icon></button>
        </div>

        <div class="um-sheet-body mac-form">
          <!-- 執行結果 -->
          <div v-if="batchResult" class="um-result">
            <div v-if="batchResult.granted.length > 0" class="mac-callout um-callout--success">
              <v-icon size="16">mdi-check-circle-outline</v-icon>
              <div>
                <div class="um-callout-title">成功授權 {{ batchResult.granted.length }} 人</div>
                <div v-for="g in batchResult.granted" :key="g.name">{{ g.name }}：{{ g.detail }}</div>
              </div>
            </div>
            <div v-if="batchResult.unchanged.length > 0" class="mac-callout">
              <v-icon size="16">mdi-information-outline</v-icon>
              <div>
                <div class="um-callout-title">{{ batchResult.unchanged.length }} 人已具備所選權限</div>
                <div>{{ batchResult.unchanged.join('、') }}</div>
              </div>
            </div>
            <div v-if="Object.keys(batchResult.quotaSkipped).length > 0" class="mac-callout mac-callout--warning">
              <v-icon size="16">mdi-alert-outline</v-icon>
              <div>
                <div class="um-callout-title">名額不足，以下未授予</div>
                <div v-for="(names, sys) in batchResult.quotaSkipped" :key="sys">{{ sys }}：{{ names.join('、') }}</div>
              </div>
            </div>
            <div v-if="batchResult.failed.length > 0" class="mac-callout mac-callout--error">
              <v-icon size="16">mdi-alert-circle-outline</v-icon>
              <div>
                <div class="um-callout-title">{{ batchResult.failed.length }} 人授權失敗</div>
                <div v-for="f in batchResult.failed" :key="f.name">{{ f.name }}：{{ f.message }}</div>
              </div>
            </div>
            <div
              v-if="batchResult.granted.length === 0 && batchResult.unchanged.length === 0 && batchResult.failed.length === 0 && Object.keys(batchResult.quotaSkipped).length === 0"
              class="mac-list-empty"
            >沒有變更</div>
          </div>

          <!-- 設定畫面 -->
          <div v-else class="um-edit um-edit--even">
            <div class="um-edit-side">
              <div class="mac-form-label um-label-first">
                <span class="um-step">1</span><span>建案</span>
                <span v-if="batchProjects.length > 0" class="um-label-note">已選 {{ batchProjects.length }}</span>
              </div>
              <v-select
                v-model="batchProjects"
                :items="batchGrantableProjects"
                multiple
                chips
                closable-chips
                variant="solo"
                flat
                density="compact"
                hide-details
                placeholder="選擇建案"
                class="mac-vfield"
                :disabled="batchSaving"
                :menu-props="{ contentClass: 'mac-menu' }"
              ></v-select>

              <div class="mac-form-label">
                <span class="um-step">2</span><span>權限</span>
                <span v-if="batchTotalSelectedCount > 0" class="um-label-note">已選 {{ batchTotalSelectedCount }}</span>
              </div>
              <div v-if="batchProjects.length === 0" class="mac-form-group mac-form-pad mac-form-empty">請先選擇建案</div>
              <div v-else class="um-panels">
                <div v-for="pp in batchProjectPanels" :key="pp.project" class="mac-form-group um-panel">
                  <div class="um-panel-head" role="button" tabindex="0" @click="toggleBatchPanel(pp.project)" @keydown.enter="toggleBatchPanel(pp.project)">
                    <span class="um-panel-name">{{ pp.project }}</span>
                    <span v-if="(batchSystemsByProject[pp.project] || []).length > 0" class="mac-filter-count">{{ batchSystemsByProject[pp.project].length }}</span>
                    <button
                      v-if="batchProjects.length > 1 && (batchSystemsByProject[pp.project] || []).length > 0"
                      type="button"
                      class="mac-link-btn"
                      :disabled="batchSaving"
                      @click.stop="applyBatchSystemsToAll(pp.project)"
                    >套用到其他建案</button>
                    <v-icon size="18" class="um-chevron" :class="{ 'is-open': isBatchPanelOpen(pp.project) }">mdi-chevron-right</v-icon>
                  </div>
                  <div v-if="isBatchPanelOpen(pp.project)" class="um-panel-body">
                    <div v-for="group in pp.groups" :key="group.id" class="um-perm-group" :style="{ '--um-tone': group.tone }">
                      <div class="um-perm-cat"><v-icon size="13">{{ group.icon }}</v-icon>{{ group.label }}</div>
                      <div class="um-perm-grid um-perm-grid--2">
                        <label v-for="system in group.items" :key="system" class="um-check-row" :class="{ 'is-disabled': batchSaving }">
                          <input
                            v-model="batchSystemsByProject[pp.project]"
                            type="checkbox"
                            class="mac-check"
                            :value="system"
                            :disabled="batchSaving"
                          >
                          <span class="um-check-text">
                            {{ system }}
                            <small v-if="getQuotaLimit(system, pp.project) > 0" class="um-quota">名額 {{ getQuotaUsed(system, pp.project) }}/{{ getQuotaLimit(system, pp.project) }}</small>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="um-edit-main">
              <div class="mac-form-label um-label-first">
                <span class="um-step">3</span><span>人員</span>
                <span v-if="batchSelectedUsers.length > 0" class="um-label-note">已選 {{ batchSelectedUsers.length }}</span>
                <span class="mac-spacer"></span>
                <button type="button" class="mac-link-btn" :disabled="batchSaving" @click="selectAllBatchUsers">全選</button>
                <button type="button" class="mac-link-btn" :disabled="batchSaving" @click="batchSelectedUsers = []">清除</button>
              </div>
              <div class="um-batch-filters">
                <v-text-field
                  v-model="batchUserSearch"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  clearable
                  class="mac-vfield mac-vfield--search"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="搜尋姓名、手機"
                  :disabled="batchSaving"
                ></v-text-field>
                <v-select
                  v-model="batchCompanyFilter"
                  :items="batchCompanyOptions"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  clearable
                  class="mac-vfield"
                  placeholder="全部公司"
                  :disabled="batchSaving"
                  :menu-props="{ contentClass: 'mac-menu' }"
                ></v-select>
              </div>
              <div class="mac-form-group um-batch-users">
                <label
                  v-for="u in batchUserList"
                  :key="u.phone"
                  class="um-batch-user"
                  :class="{ 'is-disabled': !!u.disabledReason || batchSaving }"
                >
                  <input
                    v-model="batchSelectedUsers"
                    type="checkbox"
                    class="mac-check"
                    :value="u.phone"
                    :disabled="!!u.disabledReason || batchSaving"
                  >
                  <span class="um-batch-user-main">
                    <span class="um-batch-user-name">{{ u.name }}<span v-if="u.accountDisabled" class="mac-tag mac-tag--red">已停用</span></span>
                    <span class="um-batch-user-sub">{{ u.phone }}<template v-if="u.companyName">・{{ u.companyName }}</template></span>
                  </span>
                  <span v-if="u.disabledReason" class="mac-tag">{{ u.disabledReason }}</span>
                  <span v-else-if="u.hasAll" class="mac-tag mac-tag--green">已具備</span>
                  <span v-else-if="batchTotalSelectedCount > 0 && u.ownedCount > 0" class="mac-tag">已有 {{ u.ownedCount }}/{{ batchTotalSelectedCount }}</span>
                </label>
                <div v-if="batchUserList.length === 0" class="mac-list-empty">找不到符合條件的人員</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mac-sheet-foot">
          <template v-if="!batchResult">
            <span v-if="batchSaving" class="um-progress">
              <v-progress-circular indeterminate size="16" width="2" color="grey"></v-progress-circular>
              <span>{{ batchProgress }}</span>
            </span>
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--lg" :disabled="batchSaving" @click="closeBatchDialog">取消</button>
            <button
              type="button"
              class="mac-btn mac-btn--primary mac-btn--lg"
              :disabled="batchSaving || batchTotalSelectedCount === 0 || batchSelectedUsers.length === 0"
              @click="handleBatchGrant"
            >{{ batchSaving ? '授權中…' : `授權 ${batchSelectedUsers.length} 人` }}</button>
          </template>
          <template v-else>
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" @click="closeBatchDialog">完成</button>
          </template>
        </div>
      </v-card>
    </v-dialog>

    <!-- ===== 權限功能 ===== -->
    <v-dialog v-model="isFunctionDialogVisible" persistent scrollable max-width="560" content-class="mac-dialog-fit">
      <v-card class="mac-sheet um-sheet">
        <div class="mac-sheet-head">
          <span>{{ isNewFunction ? '新增權限功能' : '編輯權限功能' }}</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="isFunctionDialogVisible = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="um-sheet-body mac-form um-sheet-pad">
          <v-form ref="functionForm">
            <div class="mac-form-group mac-form-pad um-fields">
              <div class="um-field">
                <label class="mac-sheet-label">功能 ID</label>
                <v-text-field
                  v-model="editedFunction.functionId"
                  variant="solo"
                  flat
                  density="compact"
                  class="mac-vfield"
                  hide-details="auto"
                  placeholder="newPermission"
                  :readonly="!isNewFunction"
                  :rules="[v => !!v || '必填']"
                ></v-text-field>
              </div>
              <div class="um-field">
                <label class="mac-sheet-label">顯示名稱</label>
                <v-text-field
                  v-model="editedFunction.name"
                  variant="solo"
                  flat
                  density="compact"
                  class="mac-vfield"
                  hide-details="auto"
                  :rules="[v => !!v || '必填']"
                ></v-text-field>
              </div>
              <div class="um-field">
                <label class="mac-sheet-label">描述</label>
                <v-textarea
                  v-model="editedFunction.description"
                  variant="solo"
                  flat
                  density="compact"
                  class="mac-vfield"
                  hide-details
                  rows="2"
                  auto-grow
                ></v-textarea>
              </div>
            </div>

            <div class="mac-form-group um-group-gap">
              <label class="mac-form-row um-switch-row">
                <span class="mac-form-row-main"><span class="mac-form-row-title">核心功能</span></span>
                <input v-model="editedFunction.isCore" type="checkbox" class="mac-switch" :disabled="!isNewFunction">
              </label>
            </div>

            <div class="mac-form-label">各建案名額上限</div>
            <div class="mac-form-group um-quota-list">
              <div v-for="project in projectStore.projectsList" :key="project.id" class="mac-form-row um-quota-row">
                <span class="mac-form-row-main">{{ project.name }}</span>
                <span class="mac-form-input mac-form-unit um-quota-input">
                  <input
                    type="number"
                    min="0"
                    inputmode="numeric"
                    placeholder="不限"
                    :value="editedFunction.quotaPerProject?.[project.id] || ''"
                    :aria-label="`${project.name} 名額上限`"
                    @input="setQuota(project.id, $event.target.value)"
                  >
                  <span>人</span>
                </span>
              </div>
              <div v-if="projectStore.projectsList.length === 0" class="mac-form-pad mac-form-empty">沒有建案</div>
            </div>
          </v-form>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--lg" @click="isFunctionDialogVisible = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" :disabled="savingFunction" @click="saveSystemFunction">
            {{ savingFunction ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- ===== 寄送通知信 ===== -->
    <v-dialog v-model="emailDialogVisible" persistent scrollable max-width="760" content-class="mac-dialog-fit">
      <v-card class="mac-sheet um-sheet">
        <div class="mac-sheet-head">
          <span>寄送通知信</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="emailDialogVisible = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="um-sheet-body um-sheet-pad um-mail">
          <div class="um-mail-grid">
            <div class="um-field">
              <label class="mac-sheet-label">範本</label>
              <v-select
                v-model="selectedTemplateKey"
                :items="emailTemplateOptions"
                variant="solo"
                flat
                density="compact"
                hide-details
                class="mac-vfield"
                :menu-props="{ contentClass: 'mac-menu' }"
              ></v-select>
            </div>
            <div class="um-field">
              <label class="mac-sheet-label">收件人</label>
              <v-text-field
                v-model="emailData.to"
                variant="solo"
                flat
                density="compact"
                hide-details
                class="mac-vfield"
                inputmode="email"
              ></v-text-field>
            </div>
            <div class="um-field um-field--wide">
              <label class="mac-sheet-label">主旨</label>
              <!-- 用可換行的欄位：手機上長主旨不被截斷 -->
              <v-textarea
                v-model="emailData.subject"
                variant="solo"
                flat
                density="compact"
                hide-details
                rows="1"
                auto-grow
                no-resize
                class="mac-vfield"
              ></v-textarea>
            </div>
            <div class="um-field um-field--wide">
              <label class="mac-sheet-label">附件</label>
              <v-file-input
                v-model="attachments"
                variant="solo"
                flat
                density="compact"
                hide-details
                multiple
                chips
                show-size
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                placeholder="選取檔案"
                class="mac-vfield"
              ></v-file-input>
            </div>
          </div>

          <div class="um-editor">
            <div v-if="editor" class="um-editor-bar">
              <button type="button" class="mac-icon-btn" :class="{ 'is-on': editor.isActive('bold') }" title="粗體" @click="editor.chain().focus().toggleBold().run()">
                <v-icon size="17">mdi-format-bold</v-icon>
              </button>
              <button type="button" class="mac-icon-btn" :class="{ 'is-on': editor.isActive('italic') }" title="斜體" @click="editor.chain().focus().toggleItalic().run()">
                <v-icon size="17">mdi-format-italic</v-icon>
              </button>
              <button type="button" class="mac-icon-btn" :class="{ 'is-on': editor.isActive('bulletList') }" title="項目清單" @click="editor.chain().focus().toggleBulletList().run()">
                <v-icon size="17">mdi-format-list-bulleted</v-icon>
              </button>
              <span class="um-editor-sep"></span>
              <button type="button" class="mac-icon-btn" :class="{ 'is-on': editor.isActive({ textAlign: 'left' }) }" title="靠左" @click="editor.chain().focus().setTextAlign('left').run()">
                <v-icon size="17">mdi-format-align-left</v-icon>
              </button>
              <button type="button" class="mac-icon-btn" :class="{ 'is-on': editor.isActive({ textAlign: 'center' }) }" title="置中" @click="editor.chain().focus().setTextAlign('center').run()">
                <v-icon size="17">mdi-format-align-center</v-icon>
              </button>
              <span class="um-editor-sep"></span>
              <label class="mac-icon-btn um-color-btn" title="文字顏色">
                <v-icon size="17">mdi-palette-outline</v-icon>
                <input type="color" aria-label="文字顏色" @input="editor.chain().focus().setColor($event.target.value).run()">
              </label>
            </div>
            <editor-content :editor="editor" class="um-editor-content" />
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--lg" @click="emailDialogVisible = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" :disabled="sendingEmail" @click="handleSendEmail">
            <v-icon size="16">mdi-send</v-icon><span>{{ sendingEmail ? '寄送中…' : '寄出' }}</span>
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- ===== 新增角色 ===== -->
    <v-dialog v-model="newRoleDialog" max-width="380" content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <span>新增角色</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="newRoleDialog = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <form class="um-sheet-pad" @submit.prevent="confirmCreateRole">
          <label class="mac-sheet-label">角色名稱</label>
          <v-text-field
            v-model="newRoleName"
            variant="solo"
            flat
            density="compact"
            hide-details
            autofocus
            class="mac-vfield"
          ></v-text-field>
        </form>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--lg" @click="newRoleDialog = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" :disabled="!newRoleName.trim()" @click="confirmCreateRole">新增</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- ===== 刪除角色 ===== -->
    <v-dialog v-model="deleteRoleDialog" persistent max-width="380" content-class="mac-dialog-fit">
      <v-card v-if="roleToDelete" class="mac-sheet">
        <div class="um-alert">
          <v-icon size="40" color="#d62d20">mdi-alert-circle-outline</v-icon>
          <div class="um-alert-title">刪除「{{ roleToDelete.name }}」？</div>
          <div class="mac-sheet-note">刪除後無法復原。</div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--lg" :disabled="deletingRole" @click="deleteRoleDialog = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill mac-btn--lg" :disabled="deletingRole" @click="executeDeleteRole">
            {{ deletingRole ? '刪除中…' : '刪除' }}
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- ===== 解除 LINE 綁定（僅超級管理員） ===== -->
    <v-dialog v-model="isUnbindLineDialogVisible" persistent max-width="380" content-class="mac-dialog-fit">
      <v-card v-if="unbindLineTarget" class="mac-sheet">
        <div class="um-alert">
          <v-icon size="40" color="#d62d20">mdi-link-variant-off</v-icon>
          <div class="um-alert-title">解除 {{ unbindLineTarget.name || unbindLineTarget.phone }} 的 LINE 綁定？</div>
          <div class="mac-sheet-note">解除後需由本人重新綁定。</div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--lg" :disabled="isUnbindingLine" @click="isUnbindLineDialogVisible = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill mac-btn--lg" :disabled="isUnbindingLine" @click="handleUnbindLine">
            {{ isUnbindingLine ? '解除中…' : '解除綁定' }}
          </button>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
// 引入新的 adminStore
import { useAdminStore } from '@/store/adminStore'; 
import {
  fetchUserDetailsForAdmin,
  updateUserDetailsForAdmin,
  updateUserRoles,
  updateRole,
  deleteRole,
  createSystemFunction,
  updateSystemFunction,
  unbindLineIdByAdmin,
  setUserAccountStatus,
  // fetchUserManagementInitialData, // 由 adminStore 處理
} from '@/api.js';
import { useToast } from 'vue-toastification';

// --- Tiptap 相關引入 ---
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { StarterKit } from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';


const { mdAndUp } = useDisplay();
const userStore = useUserStore();
const projectStore = useProjectStore();
const toast = useToast();
// 建立 adminStore 實例
const adminStore = useAdminStore();

const adminKey = computed(() => userStore.user?.key);

// 權限功能管理相關 State ---
const isFunctionDialogVisible = ref(false);
const isNewFunction = ref(false);
const savingFunction = ref(false);
const functionForm = ref(null);
const editedFunction = ref({
  functionId: '',
  name: '',
  description: '',
  isCore: false,
  quotaPerProject: {}
});
const functionTableHeaders = [
  { title: '顯示名稱', key: 'name' },
  { title: '功能 ID', key: 'functionId' },
  { title: '描述', key: 'description', sortable: false },
  { title: '核心', key: 'isCore' },
  { title: '名額', key: 'quotaSummary', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '56px' },
];


// --- Component State ---
const currentTab = ref('users');
const loading = ref(true); // 這個 ref 仍然用來控制本地的 "載入中" 狀態
const loadingDetails = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const showErrorAlert = ref(false);
const searchPhone = ref('');
const statusFilter = ref('all'); // all | active | disabled
const refreshing = ref(false);

// --- Data (本地 state 已被 store 取代) ---
// const adminScope = ref({}); // 由 store 取代
// const manageableUsers = ref([]); // 由 store 取代
// const managedProjects = ref([]); // 由 store 取代
// const allSystemFunctions = ref([]); // 由 store 取代
// const allUserPermissionsMap = ref(new Map()); // 由 store 取代

// --- Dialog State (For User Editing) ---
const dialogVisible = ref(false);
const isNewUser = ref(false);
const targetUser = ref(null);
const permissionMatrix = ref({});
const basicInfoForm = ref(null);
const isFormValid = ref(false);
const phoneValidationLoading = ref(false);
const phoneValidationError = ref('');
const phoneValidationSuccess = ref('');
const panels = ref([]);
const projectSearchQuery = ref('');

// --- 批次授權相關 State ---
const batchDialogVisible = ref(false);
const batchSaving = ref(false);
const batchProjects = ref([]);
const batchSystemsByProject = ref({}); // { 建案名稱: [權限名稱] }
const batchOpenPanels = ref([]);
const batchSelectedUsers = ref([]);
const batchUserSearch = ref('');
const batchCompanyFilter = ref(null);
const batchProgress = ref('');
const batchResult = ref(null);

// --- Role Management State ---
// const roles = ref([]); // 由 store 取代
const selectedRoleIndex = ref(null);
const selectedRole = ref(null);
const savingRole = ref(false);
const deleteRoleDialog = ref(false);
const roleToDelete = ref(null);
const deletingRole = ref(false);

// --- 郵件發送相關 State ---
const emailDialogVisible = ref(false);
const sendingEmail = ref(false);
const selectedTemplateKey = ref('activation');
const emailData = ref({
  to: '',
  subject: '',
  name: '',
  phone: '',
  password: ''
});
const attachments = ref([]); // 用於存放準備上傳的檔案

// 郵件範本定義
const emailTemplates = {
  activation: {
    name: '帳號開通通知',
    subject: '【ANIX建案管理系統】帳號開通通知 - {NAME} 先生/小姐',
    content: `
      <p>{NAME} 您好：</p>
      <p>歡迎加入 ANIX建案管理系統。</p>
      <p>您的系統登入帳號已正式開通，請使用以下資訊進行登入並確認權限：</p>
      <p><strong>登入網址：</strong> <a href="https://anxismart.com/#/login">https://anxismart.com/#/login</a><br>
      <strong>登入帳號：</strong> {phone}<br>
      <strong>初始密碼：</strong> {password}</p>
      <p style="color: #d32f2f;"><strong>【安全提醒】</strong> 為了保障您的帳號安全，建議您在首次登入後，盡快前往「個人資料」頁面修改您的密碼。</p>
      <p>如果您在登入過程中遇到任何問題，或發現權限設定有誤，請隨時聯繫系統管理員。</p>
      <p>祝 工作順利！</p>
      <p>ANIX建案管理系統團隊<br>發信日期：${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    `
  },
  general: {
    name: '一般通知',
    subject: '【ANIX建案管理系統】系統通知',
    content: '<p>{NAME} 您好：</p><p>請在此輸入郵件內容...</p>'
  }
};

const emailTemplateOptions = Object.entries(emailTemplates).map(([key, t]) => ({ title: t.name, value: key }));

// 初始化 Tiptap 編輯器
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
    TextStyle,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
});


const usersWithProjectData = computed(() => {
  const currentUser = userStore.user;
  const currentUserKey = currentUser?.key;

  // 1. 處理 store 中的可管理用戶
  // 由於 index.js 現在會回傳包含您在內的*所有人*，
  // adminStore.manageableUsers 已經是完整的列表。
  const allUsers = adminStore.manageableUsers.map(user => {
    const userPermissions = adminStore.allUserPermissionsMap.get(user.phone) || {};
    const projects = Object.values(userPermissions).map(p => p.projectName).filter(Boolean).sort();
    
    // 檢查這是否是當前登入的使用者
    if (user.phone === currentUserKey) {
      // 如果是，確保角色資料與 userStore 同步 (因為 userStore 的角色可能是最即時的)
      return {
        ...user,
        roles: userStore.currentUserRoles, // 使用 userStore 的角色
        projects: projects,
        projectsText: projects.join(','),
      };
    }
    
    return {
      ...user,
      projects: projects,
      projectsText: projects.join(','),
    };
  });

  // 2. 移除 "if (currentUserKey && !allUsers.some(...))" 的區塊
  // 因為 allUsers 現在保證包含 currentUser

  return allUsers;
});


// --- START: 修改 initiallyVisibleUsers (步驟 2) ---
// 計算初始可見的用戶列表（與管理員有共同建案）
const initiallyVisibleUsers = computed(() => {
  if (adminStore.isLoading) {
    return []; // 如果還在載入，返回空陣列
  }
  
  // 超級管理員可見所有人
  if (isSuperAdmin.value) {
    return usersWithProjectData.value.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh-Hant'));
  }

  // 獲取管理員擁有的所有 projectId
  const adminProjectIds = new Set(Object.keys(adminStore.adminScope).map(projectName => projectStore.nameToIdMap[projectName]).filter(Boolean));
  
  if (adminProjectIds.size === 0) {
      console.warn("[Debug] initiallyVisibleUsers: Admin scope is empty or project mapping failed.");
      // 如果管理員沒有任何建案權限 (且非超管)，只顯示他自己
      const currentUserKey = userStore.user?.key;
      const currentUserData = usersWithProjectData.value.find(u => u.phone === currentUserKey);
      return currentUserData ? [currentUserData] : [];
  }

  // 過濾出有共同建案的人員
  const filteredList = usersWithProjectData.value.filter(user => {
    // 檢查該用戶是否有任何一個 projectId 存在於管理員的 projectId 集合中
    const userPermissions = adminStore.allUserPermissionsMap.get(user.phone) || {};
    for (const userProjectId in userPermissions) {
      if (adminProjectIds.has(userProjectId)) {
        return true; // 找到共同建案，包含此用戶
      }
    }
    return false; // 沒有共同建案，排除此用戶
  });

  // 確保當前使用者一定在列表中
  const currentUserKey = userStore.user?.key;
  if (currentUserKey && !filteredList.some(u => u.phone === currentUserKey)) {
      const currentUserData = usersWithProjectData.value.find(u => u.phone === currentUserKey);
      if (currentUserData) {
          filteredList.push(currentUserData);
      }
  }
  
  return filteredList.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'zh-Hant'));
});
// --- END: 修改 initiallyVisibleUsers ---


const searchedUsers = computed(() => {
  const lowerQuery = searchPhone.value?.toLowerCase().trim();

  // 1. 決定基礎列表
  // 如果有搜尋詞，就搜尋「所有人」，否則使用「初始可見列表」
  const baseList = lowerQuery 
    ? usersWithProjectData.value // 搜尋時使用完整列表
    : initiallyVisibleUsers.value; // 預設使用過濾後列表

  // 2. 如果沒有搜尋詞，直接回傳基礎列表
  if (!lowerQuery) {
    return baseList;
  }

  // 3. 如果有搜尋詞，在 baseList 上執行過濾
  // (注意：我們現在在 baseList 上過濾，而不是在 usersWithProjectData 上，
  // 這樣就尊重了「搜尋時搜尋所有人」的邏輯)
  return baseList.filter(user =>
    user.name.toLowerCase().includes(lowerQuery) ||
    user.phone.includes(lowerQuery) ||
    (user.email && user.email.toLowerCase().includes(lowerQuery)) || // 確保 email 存在
    (user.companyName && user.companyName.toLowerCase().includes(lowerQuery)) ||
    user.projectsText.toLowerCase().includes(lowerQuery)
  );
});

// 狀態篩選（全部／啟用中／已停用）疊在搜尋結果上
const statusCounts = computed(() => {
  const list = searchedUsers.value;
  const disabled = list.filter(u => u.disabled).length;
  return { all: list.length, active: list.length - disabled, disabled };
});

const statusOptions = computed(() => [
  { value: 'all', label: '全部', count: statusCounts.value.all },
  { value: 'active', label: '啟用中', count: statusCounts.value.active },
  { value: 'disabled', label: '已停用', count: statusCounts.value.disabled },
]);

const filteredUsers = computed(() => {
  if (statusFilter.value === 'active') return searchedUsers.value.filter(u => !u.disabled);
  if (statusFilter.value === 'disabled') return searchedUsers.value.filter(u => u.disabled);
  return searchedUsers.value;
});

// ✓ 新增：建案分組計算屬性
const groupedProjects = computed(() => {
  if (adminStore.isLoading) return [];
  
  const query = searchPhone.value?.trim().toLowerCase() || '';
  const groups = [];
  
  // 1. 取得管理員有權管理的建案列表 (adminScope 的 key 為建案名稱)
  const adminProjectNames = Object.keys(adminStore.adminScope);

  adminProjectNames.forEach(projectName => {
    const projectId = projectStore.nameToIdMap[projectName];
    if (!projectId) return;

    // 2. 篩選出擁有該建案權限的使用者
    const usersInProject = adminStore.manageableUsers.filter(user => {
      const perms = adminStore.allUserPermissionsMap.get(user.phone);
      // 檢查使用者是否擁有此建案 ID 的權限
      return perms && perms[projectId];
    }).map(user => {
      // 3. 擴充使用者物件，加入該建案下的特定權限
      const perms = adminStore.allUserPermissionsMap.get(user.phone);
      return {
        ...user,
        projectSystems: perms[projectId].systems || [] // 該建案下的具體系統權限
      };
    });

    // 4. 執行搜尋過濾
    let filteredUsers = [];
    if (query) {
        if (projectName.toLowerCase().includes(query)) {
            // 如果搜尋詞匹配「建案名稱」，則顯示該建案下的所有人員
            filteredUsers = usersInProject;
        } else {
            // 否則，僅顯示匹配「人員姓名」或「電話」的人員
            filteredUsers = usersInProject.filter(u => 
                u.name.toLowerCase().includes(query) || 
                u.phone.includes(query)
            );
        }
    } else {
        filteredUsers = usersInProject;
    }

    if (filteredUsers.length > 0) {
      groups.push({
        id: projectId,
        name: projectName,
        users: filteredUsers
      });
    }
  });

  // 依照建案名稱排序
  return groups.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
});


// 建案分頁：左側選建案、右側列出成員；搜尋後選取的建案不在結果內時改選第一個
const selectedProjectId = ref(null);
const activeProjectGroup = computed(() =>
  groupedProjects.value.find(g => g.id === selectedProjectId.value) || groupedProjects.value[0] || null
);

const userManagementFields = [
    { key: 'phone', label: '手機號碼' },
    { key: 'name', label: '姓名' },
    { key: 'email', label: 'Email' },
    { key: 'password', label: '密碼' },
    { key: 'companyName', label: '公司名稱' },
    { key: 'companyTaxId', label: '統一編號' },
    { key: 'roles', label: '角色指派' },
    { key: 'permissions', label: '系統權限' }
];

const fieldPermissionOptions = [
    { title: '可讀寫', value: 'RU', color: 'green' },
    { title: '唯讀', value: 'R', color: 'blue' },
    { title: '僅供建立', value: 'C', color: 'orange' },
    { title: '隱藏', value: 'H', color: 'grey' }
];

// ✓ [修改]：更新權限分類定義
const permissionCategories = [
  {
    id: 'sales',
    label: '銷售系統',
    icon: 'mdi-home-city',
    color: 'blue-darken-2',
    tone: '#0071e3',
    keywords: ['銷控', '報價', '銷售StandBy', '請佣']
  },
  {
    id: 'inspection',
    label: '驗屋系統',
    icon: 'mdi-clipboard-check',
    color: 'teal-darken-2',
    tone: '#0f8a7e',
    keywords: ['驗屋', '客變']
  },
  {
    id: 'customer',
    label: '客資管理',
    icon: 'mdi-account-group',
    color: 'purple-darken-2',
    tone: '#8a3ffc',
    keywords: ['客資系統', '貴賓', '客戶管理']
  },
  {
    id: 'admin',
    label: '後台管理',
    icon: 'mdi-cog',
    color: 'blue-grey',
    tone: '#5b6472',
    keywords: ['人員', '訂閱', '資料庫']
  },
  {
    id: 'message',
    label: '訊息通知',
    icon: 'mdi-email',
    color: 'amber-darken-4',
    tone: '#b86a00',
    keywords: ['訊息', '寄信', '收信', 'LINE AI']
  }
];

// ✓ [新增]：將使用者的權限陣列依照分類分組的 Helper 函式
const getGroupedUserPermissions = (userSystems) => {
  if (!userSystems || userSystems.length === 0) return [];

  // 建立分類容器
  const groups = permissionCategories.map(cat => ({
    ...cat,
    permissions: []
  }));

  const otherGroup = {
    id: 'other',
    label: '其他功能',
    icon: 'mdi-dots-horizontal',
    color: 'grey-darken-1',
    tone: '#6e6e73',
    permissions: []
  };

  // 分配權限到對應群組
  userSystems.forEach(sys => {
    let matched = false;
    for (const group of groups) {
      // 只要包含任一關鍵字就算匹配
      if (group.keywords.some(k => sys.includes(k))) {
        group.permissions.push(sys);
        matched = true;
        break; // 找到第一個匹配的分類就停止
      }
    }
    if (!matched) {
      otherGroup.permissions.push(sys);
    }
  });

  // 過濾掉空的群組，並加入「其他」群組 (如果有內容)
  const result = groups.filter(g => g.permissions.length > 0);
  if (otherGroup.permissions.length > 0) {
    result.push(otherGroup);
  }

  return result;
};

// ✓ 新增：將權限自動分類的計算屬性
const groupedPermissions = computed(() => {
  const groups = permissionCategories.map(cat => ({
    ...cat,
    items: []
  }));
  
  const otherGroup = {
    id: 'other',
    label: '其他功能',
    icon: 'mdi-dots-horizontal',
    color: 'grey-darken-1',
    tone: '#6e6e73',
    items: []
  };

  // 遍歷所有功能名稱，依關鍵字歸類
  allFunctionNames.value.forEach(funcName => {
    let matched = false;
    for (const group of groups) {
      if (group.keywords.some(k => funcName.includes(k))) {
        group.items.push(funcName);
        matched = true;
        break; // 找到分類即停止，避免重複
      }
    }
    if (!matched) {
      otherGroup.items.push(funcName);
    }
  });

  // 過濾掉沒有項目的群組，並加入「其他」群組(如果有項目)
  const result = groups.filter(g => g.items.length > 0);
  if (otherGroup.items.length > 0) {
    result.push(otherGroup);
  }
  
  return result;
});


// --- Validation Rules ---
const rules = {
  required: [ value => !!value || '此欄位為必填項。' ],
};

// --- 解除 LINE 綁定（僅超級管理員） ---
const isUnbindLineDialogVisible = ref(false);
const unbindLineTarget = ref(null);
const isUnbindingLine = ref(false);

function openUnbindLineDialog(item) {
  unbindLineTarget.value = item;
  isUnbindLineDialogVisible.value = true;
}

async function handleUnbindLine() {
  const target = unbindLineTarget.value;
  if (!target) return;
  isUnbindingLine.value = true;
  try {
    const res = await unbindLineIdByAdmin({
      adminKey: adminKey.value,
      targetUserKey: target.phone,
    });
    if (res?.alreadyUnbound) {
      toast.info(`${target.name || target.phone} 目前並未綁定 LINE。`);
    } else {
      toast.success(`已解除 ${target.name || target.phone} 的 LINE 綁定。`);
    }
    isUnbindLineDialogVisible.value = false;
    unbindLineTarget.value = null;
    if (targetUser.value?.basicInfo.phone === target.phone) {
      targetAccount.value = { ...targetAccount.value, lineBound: false, lineSuspended: false };
    }
    // 背景更新人員列表，讓「已綁定／未綁定」狀態即時更新
    await loadInitialData({ silent: true });
  } catch (err) {
    console.error('解除 LINE 綁定失敗:', err);
    toast.error(`解除失敗：${err?.message || '未知錯誤'}`);
  } finally {
    isUnbindingLine.value = false;
  }
}

// --- 帳號停用／啟用（一鍵切換；限超級管理員、系統管理員） ---
// 停用後該帳號無法登入、所有功能與 LINE 入口／通知都失效；權限保留，啟用後恢復。
const selfKey = computed(() => userStore.user?.key);
const statusSaving = reactive({}); // { [phone]: true } 送出中的列
const targetAccount = ref({ disabled: false, disabledAt: null, disabledByName: '', lineBound: false, lineSuspended: false });

const statusLockReason = (user) => {
  if (!user) return '無法變更';
  if (!canViewAndEditRoles.value) return '僅限管理員變更';
  if (user.phone === selfKey.value) return '不可停用自己';
  if (user.isTrial) return '試用帳號';
  if ((user.roles || []).includes('超級管理員') && !isSuperAdmin.value) return '僅限超級管理員變更';
  return '';
};

// event：開關的 change 事件。原生開關點下去就先切換，處理完再把畫面同步回實際狀態
// （不可用 click.prevent：瀏覽器會在事件結束後把勾選狀態還原，蓋掉 Vue 的更新）
const toggleAccountStatus = async (user, event) => {
  const phone = user?.phone;
  const findStoreUser = () => adminStore.manageableUsers.find(u => u.phone === phone);
  const syncSwitch = () => {
    const el = event?.target;
    if (el?.isConnected) el.checked = !findStoreUser()?.disabled;
  };
  if (!user || statusSaving[phone] || statusLockReason(user)) {
    syncSwitch();
    return;
  }
  const name = user.name || phone;
  const nextDisabled = !user.disabled;
  const before = findStoreUser();
  if (!before) return;
  const previous = { disabled: before.disabled, lineId: before.lineId, lineSuspended: before.lineSuspended };
  const applyToDialog = (state) => {
    if (targetUser.value?.basicInfo.phone !== phone) return;
    targetAccount.value = {
      ...targetAccount.value,
      disabled: state.disabled === true,
      disabledAt: state.disabled ? Date.now() : null,
      disabledByName: state.disabled ? (userStore.user?.name || '') : '',
      lineBound: !!state.lineId,
      lineSuspended: state.lineSuspended === true,
    };
  };

  // 先更新畫面，失敗再還原
  statusSaving[phone] = true;
  before.disabled = nextDisabled;
  if (nextDisabled && before.lineId) {
    before.lineId = null;
    before.lineSuspended = true;
  }
  applyToDialog(before);

  try {
    const res = await setUserAccountStatus({
      adminKey: adminKey.value,
      sessionId: userStore.sessionId,
      targetUserKey: phone,
      disabled: nextDisabled,
    });
    const current = findStoreUser();
    if (current) {
      current.disabled = res.disabled === true;
      current.lineId = res.lineId || null;
      current.lineSuspended = res.lineSuspended === true;
      applyToDialog(current);
    }
    toast.success(res.disabled ? `已停用 ${name}` : `已啟用 ${name}`);
    if (res.lineConflict) toast.warning(`${name} 的 LINE 已綁定其他帳號，需重新綁定。`);
  } catch (err) {
    const current = findStoreUser();
    if (current) {
      Object.assign(current, previous);
      applyToDialog(current);
    }
    toast.error(`變更失敗：${err?.message || '未知錯誤'}`);
  } finally {
    delete statusSaving[phone];
    await nextTick();
    syncSwitch();
  }
};

// 編輯視窗內的帳號狀態、角色：以列表上的同一筆資料為準（立即生效，不等「儲存」）
const editingListUser = computed(() => {
  const phone = targetUser.value?.basicInfo.phone;
  return (phone && !isNewUser.value && usersWithProjectData.value.find(u => u.phone === phone)) || null;
});

const toggleTargetAccountStatus = (event) => {
  if (editingListUser.value) toggleAccountStatus(editingListUser.value, event);
  else if (event?.target) event.target.checked = !targetAccount.value.disabled;
};

const targetStatusLockReason = computed(() => statusLockReason(editingListUser.value));

const formatDateTime = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const accountStatusText = computed(() => {
  const account = targetAccount.value;
  if (!account.disabled) return '啟用中';
  const parts = [account.disabledByName, formatDateTime(account.disabledAt)].filter(Boolean);
  return parts.length ? `已停用・${parts.join(' ')}` : '已停用';
});

// --- 顯示用小工具 ---
const initialOf = (name) => {
  const text = String(name || '').trim();
  if (!text || text === 'N/A') return '?';
  // 中文姓名取最後一個字（名），英文取第一個字母
  return /^[\x00-\x7f]/.test(text) ? text[0].toUpperCase() : text.slice(-1);
};

/** LINE 綁定狀態：bound 已綁定／suspended 停用期間暫停／none 未綁定 */
const lineStateOf = (user) => {
  if (user?.lineId || user?.lineBound) return 'bound';
  if (user?.lineSuspended) return 'suspended';
  return 'none';
};
const LINE_STATE_META = {
  bound: { label: '已綁定', tagClass: 'mac-tag--green' },
  suspended: { label: '暫停', tagClass: 'mac-tag--orange' },
  none: { label: '未綁定', tagClass: '' },
};
const lineMetaOf = (user) => LINE_STATE_META[lineStateOf(user)];

const userRowProps = ({ item }) => ({ class: item.disabled ? 'um-row--off' : '' });

// 表格內的建案標籤最多顯示幾個，其餘收成「+N」
const PROJECT_TAG_LIMIT = 3;

// --- 角色指派選單（整頁共用一個，點哪一列就掛到哪一列） ---
const roleMenu = reactive({ open: false, activator: null, phone: null });
const roleMenuUser = computed(() =>
  roleMenu.phone ? usersWithProjectData.value.find(u => u.phone === roleMenu.phone) || null : null
);
const roleMenuOptions = computed(() => {
  const owned = roleMenuUser.value?.roles || [];
  const assignable = availableRolesForAssignment.value;
  return [
    ...assignable.map(name => ({ name, locked: false })),
    // 已擁有但操作者無權指派的角色：只顯示、不可變更
    ...owned.filter(r => !assignable.includes(r)).map(name => ({ name, locked: true })),
  ];
});
const openRoleMenu = async (event, user) => {
  const activator = event.currentTarget;
  roleMenu.open = false;
  await nextTick();
  roleMenu.activator = activator;
  roleMenu.phone = user.phone;
  roleMenu.open = true;
};
const toggleRole = (roleName) => {
  const user = roleMenuUser.value;
  if (!user || user.rolesLoading) return;
  const roles = user.roles || [];
  const next = roles.includes(roleName) ? roles.filter(r => r !== roleName) : [...roles, roleName];
  handleRolesChange(user, next);
};

// --- Computed Properties ---
const isSuperAdmin = computed(() => userStore.currentUserRoles.includes('超級管理員'));

const isGodModeAdmin = computed(() => {
  const roles = userStore.currentUserRoles;
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});

const isEditingSelf = computed(() => {
  if (!targetUser.value || !userStore.user) return false;
  return targetUser.value.basicInfo.phone === userStore.user.key;
});

const allRoleNames = computed(() => adminStore.allRoleNames);

const allFunctionNames = computed(() => adminStore.allFunctionNames);

const managedProjects = computed(() => Object.keys(adminStore.adminScope).sort((a,b) => a.localeCompare(b, 'zh-Hant')));

const filteredManagedProjects = computed(() => {
  if (!projectSearchQuery.value) {
    return managedProjects.value;
  }
  return managedProjects.value.filter(project =>
    project.toLowerCase().includes(projectSearchQuery.value.toLowerCase())
  );
});

const currentUserRoles = computed(() => userStore.currentUserRoles);
const canViewAndEditRoles = computed(() => currentUserRoles.value.includes('超級管理員') || currentUserRoles.value.includes('系統管理員'));

const availableRolesForAssignment = computed(() => {
  if (isSuperAdmin.value) return allRoleNames.value;
  const grantableSet = new Set();
  const adminRoles = userStore.currentUserRoles;
  
  adminStore.roles.forEach(roleDef => {
    if (adminRoles.includes(roleDef.name)) {
      (roleDef.grantableRoles || []).forEach(gRole => grantableSet.add(gRole));
    }
  });
  return Array.from(grantableSet);
});

const tableHeaders = computed(() => {
  const headers = [
    { title: '姓名', align: 'start', key: 'name', minWidth: '200px' },
    { title: '手機', key: 'phone' },
    { title: '公司', key: 'companyName' },
    { title: 'LINE', key: 'lineId', sortable: false },
    { title: '建案', key: 'projects', sortable: false },
  ];
  if (canViewAndEditRoles.value) {
    headers.push({ title: '角色', key: 'roles', sortable: false });
  }
  headers.push({ title: '狀態', key: 'disabled', width: '136px' });
  headers.push({ title: '', key: 'actions', sortable: false, align: 'end', width: '108px' });
  return headers;
});

// --- 分頁 ---
const tabOptions = computed(() => {
  const tabs = [
    { value: 'users', label: '人員' },
    { value: 'projects', label: '建案' },
  ];
  if (isSuperAdmin.value) {
    tabs.push({ value: 'roles', label: '角色' }, { value: 'functions', label: '權限功能' });
  }
  return tabs;
});

const tabCountText = computed(() => {
  if (adminStore.isLoading) return '';
  if (currentTab.value === 'users') return `${filteredUsers.value.length} 人`;
  if (currentTab.value === 'projects') return `${groupedProjects.value.length} 個建案`;
  if (currentTab.value === 'roles') return `${adminStore.roles.length} 個角色`;
  return `${adminStore.systemFunctions.length} 項`;
});

const currentUserFieldPermissions = computed(() => {
    if (isSuperAdmin.value) {
        const allPermissions = {};
        userManagementFields.forEach(field => {
            allPermissions[field.key] = 'RU';
        });
        return allPermissions;
    }
    const merged = {};
    const adminRoles = userStore.currentUserRoles;
    adminStore.roles.forEach(roleDef => {
        if (adminRoles.includes(roleDef.name)) {
            const perms = roleDef.fieldPermissions?.UserManagement || {};
            Object.assign(merged, perms);
        }
    });
    return merged;
});

const getFieldPermission = (fieldName) => {
    return currentUserFieldPermissions.value[fieldName] || '';
};

const functionDescriptionMap = computed(() => adminStore.functionDescriptionMap);

const isTargetUserAdmin = computed(() => {
  if (!targetUser.value || !targetUser.value.basicInfo.roles) return false;
  const roles = targetUser.value.basicInfo.roles;
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});



// --- Watchers ---
const BUILT_IN_ROLES = ['超級管理員', '系統管理員'];
const isBuiltInRole = computed(() => BUILT_IN_ROLES.includes(selectedRole.value?.id));

const loadSelectedRole = () => {
  const newIndex = selectedRoleIndex.value;
  if (newIndex != null && adminStore.roles[newIndex]) {
    selectedRole.value = JSON.parse(JSON.stringify(adminStore.roles[newIndex]));
    
    if (!selectedRole.value.fieldPermissions) {
        selectedRole.value.fieldPermissions = {};
    }
    if (!selectedRole.value.fieldPermissions.UserManagement) {
        selectedRole.value.fieldPermissions.UserManagement = {};
    }
    userManagementFields.forEach(field => {
        if (selectedRole.value.fieldPermissions.UserManagement[field.key] === undefined) {
            selectedRole.value.fieldPermissions.UserManagement[field.key] = 'RU';
        }
    });

  } else {
    selectedRole.value = null;
  }
};
watch(selectedRoleIndex, loadSelectedRole);

/** 重新載入後依名稱重新選取角色（改名或排序變動後索引會變） */
const reselectRole = (name) => {
  const index = adminStore.roles.findIndex(r => r.name === name);
  selectedRoleIndex.value = index >= 0 ? index : null;
  loadSelectedRole();
};

watch(filteredManagedProjects, (newVal) => {
  if (projectSearchQuery.value) {
    panels.value = [...newVal];
  }
});

// --- Core Logic ---
// silent：儲存後背景更新，不清空列表、不顯示載入中
const loadInitialData = async ({ silent = false } = {}) => {
  loading.value = !silent;
  errorMessage.value = '';
  showErrorAlert.value = false;
  try {
    // 確保 projectStore 已載入 (它有自己的快取)
    await projectStore.fetchProjects();
    
    // 呼叫 adminStore (強制重新載入以避免身分切換時的資料殘留)
    await adminStore.loadAdminData(adminKey.value, true, { silent });

  } catch (error) {
    console.error('[UserManagement.vue] loadInitialData 失敗:', error);
    errorMessage.value = `初始化失敗: ${error.message}`;
    showErrorAlert.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadInitialData());

const refresh = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await loadInitialData({ silent: adminStore.isLoaded });
  } finally {
    refreshing.value = false;
  }
};

// ✅ 新增：權限檢查 - 防止非管理員通過滑動切換進入受保護TAB
watch(currentTab, (newTab) => {
  const adminOnlyTabs = ['roles', 'functions'];

  if (adminOnlyTabs.includes(newTab) && !isSuperAdmin.value) {
    // 非超級管理員試圖進入管理員專用區域，強制重定向回用戶列表
    currentTab.value = 'users';
    return;
  }
  // 進入角色分頁時預設選第一個角色，右側不留白
  if (newTab === 'roles' && selectedRoleIndex.value == null && adminStore.roles.length > 0) {
    selectedRoleIndex.value = 0;
  }
});

// --- User Editing Dialog Logic ---
const resetPhoneValidation = () => {
  phoneValidationLoading.value = false;
  phoneValidationError.value = '';
  phoneValidationSuccess.value = '';
};

const openEditDialog = async (phone) => {
  resetPhoneValidation();
  isNewUser.value = false;
  dialogVisible.value = true;
  loadingDetails.value = true;
  try {
    const result = await fetchUserDetailsForAdmin(phone, adminKey.value);
    if (result.status === 'success') {
      targetUser.value = result.data;
      const listUser = usersWithProjectData.value.find(u => u.phone === phone);
      targetAccount.value = {
        disabled: (result.data.account?.disabled ?? listUser?.disabled) === true,
        disabledAt: result.data.account?.disabledAt || null,
        disabledByName: result.data.account?.disabledByName || '',
        lineBound: result.data.account ? result.data.account.lineBound === true : !!listUser?.lineId,
        lineSuspended: (result.data.account?.lineSuspended ?? listUser?.lineSuspended) === true,
      };
      buildPermissionMatrix(result.data.permissions);
      prepareEditPanels(result.data.permissions);
    } else { throw new Error(result.message); }
  } catch (error) {
    toast.error(`載入用戶資料失敗: ${error.message}`);
    closeDialog();
  } finally {
    loadingDetails.value = false;
  }
};

const openCreateDialog = (phone = '') => {
  resetPhoneValidation();
  isNewUser.value = true;
  targetUser.value = { basicInfo: { phone, name: '', email: '', password: '', companyName: '', companyTaxId: '', roles: [], allowMultiLogin: false }, permissions: {} };
  targetAccount.value = { disabled: false, disabledAt: null, disabledByName: '', lineBound: false, lineSuspended: false };
  buildPermissionMatrix({});
  prepareEditPanels({});
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  targetUser.value = null;
  permissionMatrix.value = {};
  panels.value = [];
  ownedProjectsAtOpen.value = [];
  projectSearchQuery.value = '';
};

const handleSearchUser = async () => {
  const phone = searchPhone.value.trim();
  if (!phone) return;
  loadingDetails.value = true;
  const result = await fetchUserDetailsForAdmin(phone, adminKey.value);
  if (result.status === 'success') {
    openEditDialog(phone);
  } else if (result.message.includes('找不到')) {
    openCreateDialog(phone);
  } else {
    toast.error(`查詢失敗: ${result.message}`);
  }
  loadingDetails.value = false;
};

const buildPermissionMatrix = (permissionsObject) => {
  const matrix = {};
 allFunctionNames.value.forEach(system => {
    matrix[system] = {};
    managedProjects.value.forEach(project => {
      matrix[system][project] = false;
    });
  });
  for (const projectId in permissionsObject) {
    const { projectName, systems } = permissionsObject[projectId];
    if (systems) {
      systems.forEach(system => {
        if (matrix[system] && matrix[system][projectName] !== undefined) {
          matrix[system][projectName] = true;
        }
      });
    }
  }
  permissionMatrix.value = matrix;
};

const expandAll = () => { panels.value = [...filteredManagedProjects.value]; };
const collapseAll = () => { panels.value = []; };

// 開啟編輯時：已有權限的建案排最前面並自動展開（最多 4 個），之後勾選不再重新排序
const ownedProjectsAtOpen = ref([]);
const prepareEditPanels = (permissionsObject) => {
  const owned = Object.values(permissionsObject || {})
    .filter(p => p && Array.isArray(p.systems) && p.systems.length > 0)
    .map(p => p.projectName)
    .filter(name => managedProjects.value.includes(name));
  ownedProjectsAtOpen.value = owned;
  panels.value = owned.length > 0
    ? owned.slice(0, 4)
    : (managedProjects.value.length === 1 ? [...managedProjects.value] : []);
};
const editProjects = computed(() => {
  const owned = new Set(ownedProjectsAtOpen.value);
  const list = filteredManagedProjects.value;
  return [...list.filter(p => owned.has(p)), ...list.filter(p => !owned.has(p))];
});

const isPanelOpen = (project) => panels.value.includes(project);
const togglePanel = (project) => {
  panels.value = isPanelOpen(project)
    ? panels.value.filter(p => p !== project)
    : [...panels.value, project];
};

const projectSelectedCount = (project) =>
  allFunctionNames.value.filter(system => permissionMatrix.value[system]?.[project]).length;

// 建案整批勾選：欄位唯讀，或非超管／系管且在此建案沒有「人員管理」權限時不可用
const isProjectToggleDisabled = (project) =>
  getFieldPermission('permissions') === 'R' ||
  (!isGodModeAdmin.value && !adminStore.adminScope[project]?.includes('人員管理'));

// 單一權限：不能編輯自己（超管／系管除外）；一般管理員需在該建案有「人員管理」且自己擁有該權限
const isPermissionDisabled = (system, project) => {
  if (isEditingSelf.value && !isGodModeAdmin.value) return true;
  if (getFieldPermission('permissions') === 'R') return true;
  if (isGodModeAdmin.value) return false;
  const scope = adminStore.adminScope[project];
  return !scope?.includes('人員管理') || !scope?.includes(system);
};

// 原生勾選框：名額已滿等情況會拒絕勾選，處理完把畫面同步回實際狀態
const onPermissionChange = (system, project, event) => {
  handlePermissionToggle(system, project, event.target.checked);
  event.target.checked = !!permissionMatrix.value[system]?.[project];
};
const onProjectToggleChange = (project, event) => {
  toggleAllForProject(project, event.target.checked);
  event.target.checked = isAllSelectedForProject(project);
};

const isAllSelectedForProject = (project) => {
  const systemsAdminCanManage = adminStore.adminScope[project] || [];
  if (systemsAdminCanManage.length === 0) return false;
  
  return systemsAdminCanManage.every(system => permissionMatrix.value[system]?.[project]);
};

const isIndeterminateForProject = (project) => {
  const systemsAdminCanManage = adminStore.adminScope[project] || [];
  if (systemsAdminCanManage.length === 0) return false;

  const selectedCount = systemsAdminCanManage.filter(system => permissionMatrix.value[system]?.[project]).length;
  
  return selectedCount > 0 && selectedCount < systemsAdminCanManage.length;
};

const toggleAllForProject = (project, isSelected) => {
  const systemsAdminCanManage = adminStore.adminScope[project] || [];
  const quotaBlockedSystems = []; // 記錄因 quota 被擋的權限

  // 判斷被編輯者是否為管理員角色 (不受 quota 限制)
  let isTargetAdmin = false;
  if (targetUser.value) {
    const targetRoles = targetUser.value.basicInfo.roles || [];
    isTargetAdmin = targetRoles.includes('系統管理員') || targetRoles.includes('超級管理員');
  }

  systemsAdminCanManage.forEach(system => {
    if (permissionMatrix.value[system]) {
      if (isSelected && !isTargetAdmin) {
        // 勾選時檢查 quota
        if (isQuotaFull(system, project)) {
          quotaBlockedSystems.push(system);
          return; // 跳過此項
        }
      }
      permissionMatrix.value[system][project] = isSelected;
    }
  });

  if (quotaBlockedSystems.length > 0) {
    toast.warning(`以下權限功能已達名額上限，無法勾選：${quotaBlockedSystems.join('、')}`);
  }
};

const handleSave = async () => {
  if (basicInfoForm.value) {
    const { valid } = await basicInfoForm.value.validate();
    if (!valid) {
      toast.error('請填寫所有必填欄位。');
      return;
    }
  }

  if (isNewUser.value) {
    let hasAtLeastOnePermission = false;
    for (const system in permissionMatrix.value) {
      for (const project in permissionMatrix.value[system]) {
        if (permissionMatrix.value[system][project] === true) {
          hasAtLeastOnePermission = true;
          break;
        }
      }
      if (hasAtLeastOnePermission) {
        break;
      }
    }

    if (!hasAtLeastOnePermission) {
      toast.error('請至少為新人員指派一項系統權限。');
      return;
    }
  }

  saving.value = true;
  try {
    const newPermissionsObject = {};
    for (const system of allFunctionNames.value) {
      for (const projectName of managedProjects.value) {
        if (permissionMatrix.value[system]?.[projectName] === true) {
          const projectId = projectStore.nameToIdMap[projectName];
          if (projectId) {
            if (!newPermissionsObject[projectId]) {
              newPermissionsObject[projectId] = { projectName, systems: [] };
            }
            newPermissionsObject[projectId].systems.push(system);
          }
        }
      }
    }
    const payload = {
      targetUserKey: targetUser.value.basicInfo.phone.trim(),
      adminKey: adminKey.value,
      adminName: userStore.user?.name,
      basicInfo: targetUser.value.basicInfo,
      permissions: newPermissionsObject,
      isNewUser: isNewUser.value
    };
    const result = await updateUserDetailsForAdmin(payload);
    if (result.status === 'success') {
      toast.success(isNewUser.value ? '新人員建立成功！' : '人員資料更新成功！');
      closeDialog();
      // 儲存成功後，清除快取並重新載入
      await loadInitialData({ silent: true });
    } else {
      throw new Error(result.message || '發生未知的錯誤');
    }
  } catch (error) {
    toast.error(`儲存失敗：${error.message}`);
  } finally {
    saving.value = false;
  }
};


const validatePhoneNumber = async () => {
  if (!isNewUser.value) return;
  const phone = targetUser.value.basicInfo.phone?.trim();
  phoneValidationError.value = '';
  phoneValidationSuccess.value = '';
  if (!phone) return;
  phoneValidationLoading.value = true;
  try {
    const checkResult = await fetchUserDetailsForAdmin(phone, adminKey.value);
    if (checkResult.status === 'success') {
      phoneValidationError.value = '此手機號碼已被註冊。';
    } else if (checkResult.status === 'error' && checkResult.message.includes('找不到')) {
      phoneValidationSuccess.value = '此手機號碼可使用。';
    } else {
      phoneValidationError.value = '驗證時發生錯誤。';
    }
  } catch (e) {
    phoneValidationError.value = '網路連線錯誤，無法驗證。';
  } finally {
    phoneValidationLoading.value = false;
  }
};

// --- Role Assignment & Management Logic ---
const handleRolesChange = async (user, newRoles) => {
  if (JSON.stringify(user.roles) === JSON.stringify(newRoles)) return;
  const userInTable = adminStore.manageableUsers.find(u => u.phone === user.phone);
  if (!userInTable) return;
  userInTable.rolesLoading = true;
  try {
    await updateUserRoles(user.phone, newRoles);
    userInTable.roles = newRoles;
    // 編輯視窗開著時同步，避免按「儲存」把舊角色寫回去
    if (targetUser.value?.basicInfo.phone === user.phone) targetUser.value.basicInfo.roles = [...newRoles];
    toast.success(`已更新 ${user.name} 的角色`);
    // 更改角色後，清除快取 (因為權限可能已改變)
    // adminStore.invalidateCache(); // Remove this line to prevent data clearing
    // (下次載入 loadInitialData 會自動重抓)
  } catch (error) {
    toast.error(`更新角色失敗: ${error.message}`);
    const originalUser = await fetchUserDetailsForAdmin(user.phone, adminKey.value);
    if(originalUser.status === 'success') {
        userInTable.roles = originalUser.data.basicInfo.roles || [];
    }
  } finally {
    userInTable.rolesLoading = false;
  }
};

// 新增角色：輸入名稱後先加入列表，按「儲存」才寫入
const newRoleDialog = ref(false);
const newRoleName = ref('');

const createNewRole = () => {
  newRoleName.value = '';
  newRoleDialog.value = true;
};

const confirmCreateRole = () => {
  const name = newRoleName.value.trim();
  if (!name) return;
  if (adminStore.roles.some(r => r.name === name)) {
    toast.error('角色名稱已存在！');
    return;
  }
  const newRole = {
    id: name,
    name: name,
    grantableRoles: [],
    fieldPermissions: { UserManagement: {} }
  };
  userManagementFields.forEach(field => {
    if (field.key === 'phone') {
      newRole.fieldPermissions.UserManagement[field.key] = 'R';
    } else if (field.key === 'password') {
      newRole.fieldPermissions.UserManagement[field.key] = 'C';
    } else {
      newRole.fieldPermissions.UserManagement[field.key] = 'RU';
    }
  });
  adminStore.roles.push(newRole);
  selectedRoleIndex.value = adminStore.roles.length - 1;
  newRoleDialog.value = false;
};

const saveRole = async () => {
    if (!selectedRole.value || !selectedRole.value.name) {
        toast.error("角色名稱不能為空！");
        return;
    }
    savingRole.value = true;
    try {
        const roleDataToSave = {
            name: selectedRole.value.name,
            grantableRoles: selectedRole.value.grantableRoles || [],
            fieldPermissions: selectedRole.value.fieldPermissions || {}
        };

        if (selectedRole.value.id !== selectedRole.value.name) {
            await deleteRole(selectedRole.value.id);
        }
        
        const savedName = selectedRole.value.name;
        await updateRole(savedName, roleDataToSave);
        toast.success(`角色「${savedName}」已成功儲存！`);
        // 儲存角色後背景重載，並依名稱重新選取
        await loadInitialData({ silent: true });
        reselectRole(savedName);
    } catch (error) {
        toast.error(`儲存角色失敗：${error.message}`);
    } finally {
        savingRole.value = false;
    }
};

const confirmDeleteRole = (role) => {
    roleToDelete.value = role;
    deleteRoleDialog.value = true;
};

const executeDeleteRole = async () => {
    deletingRole.value = true;
    try {
        await deleteRole(roleToDelete.value.id);
        toast.success(`角色「${roleToDelete.value.name}」已刪除。`);
        deleteRoleDialog.value = false;
        selectedRole.value = null;
        selectedRoleIndex.value = null;
        // 刪除角色後，清除快取並重載
        await loadInitialData({ silent: true });
    } catch (error) {
        toast.error(`刪除角色失敗：${error.message}`);
    } finally {
        deletingRole.value = false;
    }
};

// 權限功能管理相關 Methods ---
const openFunctionDialog = (func = null) => {
  if (func) {
    // 編輯模式
    isNewFunction.value = false;
    editedFunction.value = { ...func, quotaPerProject: { ...(func.quotaPerProject || {}) } };
  } else {
    // 新增模式
    isNewFunction.value = true;
    editedFunction.value = { functionId: '', name: '', description: '', isCore: false, quotaPerProject: {} };
  }
  isFunctionDialogVisible.value = true;
};

// --- 名額上限 (Quota) 相關方法 ---

/** 設定某建案的名額上限 */
const setQuota = (projectId, value) => {
  const num = parseInt(value, 10);
  if (!editedFunction.value.quotaPerProject) {
    editedFunction.value.quotaPerProject = {};
  }
  if (isNaN(num) || num <= 0) {
    // 清除此建案的 quota 設定
    delete editedFunction.value.quotaPerProject[projectId];
  } else {
    editedFunction.value.quotaPerProject[projectId] = num;
  }
};

/**
 * 建立 quota 查詢 Map: { functionName: { projectId: limit } }
 * 從 adminStore.systemFunctions 整理而來
 */
const quotaMap = computed(() => {
  const map = {};
  adminStore.systemFunctions.forEach(func => {
    if (func.quotaPerProject && Object.keys(func.quotaPerProject).length > 0) {
      map[func.name] = func.quotaPerProject;
    }
  });
  return map;
});

/**
 * 計算某建案在某權限功能下「已佔用」的名額 (排除系統管理員 & 超級管理員)
 */
const getQuotaUsed = (systemFuncName, projectName) => {
  const projectId = projectStore.nameToIdMap[projectName];
  if (!projectId) return 0;

  let count = 0;
  // 遍歷所有使用者的權限
  adminStore.allUserPermissionsMap.forEach((perms, userPhone) => {
    // 檢查此使用者在該建案是否有此權限
    if (perms[projectId]?.systems?.includes(systemFuncName)) {
      // 檢查此使用者是否為管理員角色 (需排除)
      const user = adminStore.manageableUsers.find(u => u.phone === userPhone);
      const userRoles = user?.roles || [];
      const isAdminRole = userRoles.includes('系統管理員') || userRoles.includes('超級管理員');
      if (!isAdminRole) {
        count++;
      }
    }
  });
  return count;
};

/** 取得某權限功能在某建案的 quota 上限 */
const getQuotaLimit = (systemFuncName, projectName) => {
  const projectId = projectStore.nameToIdMap[projectName];
  if (!projectId) return 0;
  return quotaMap.value[systemFuncName]?.[projectId] || 0;
};

/** 判斷某權限功能在某建案是否已達上限 */
const isQuotaFull = (systemFuncName, projectName) => {
  const limit = getQuotaLimit(systemFuncName, projectName);
  if (!limit || limit <= 0) return false; // 無限制

  // 計算已使用數量 (但要排除正在編輯的使用者，因為他目前的勾選不應重複計算)
  let used = getQuotaUsed(systemFuncName, projectName);

  // 如果是編輯模式 (非新增)，且「被編輯者」目前已擁有此權限，
  // 則應從 used 中扣除 1 (因為他的名額已被計算在內)
  if (!isNewUser.value && targetUser.value) {
    const editingPhone = targetUser.value.basicInfo.phone;
    const editingUser = adminStore.manageableUsers.find(u => u.phone === editingPhone);
    const editingRoles = editingUser?.roles || [];
    const isEditingAdmin = editingRoles.includes('系統管理員') || editingRoles.includes('超級管理員');
    if (!isEditingAdmin) {
      // 如果被編輯者「原本」就有此權限，扣 1
      const projectId = projectStore.nameToIdMap[projectName];
      const originalPerms = adminStore.allUserPermissionsMap.get(editingPhone);
      if (originalPerms?.[projectId]?.systems?.includes(systemFuncName)) {
        used--;
      }
    }
  }

  return used >= limit;
};

/** 取得 quota 相關的 tooltip 文字 */
const getQuotaTooltip = (systemFuncName, projectName) => {
  const limit = getQuotaLimit(systemFuncName, projectName);
  if (!limit || limit <= 0) return ''; // 無限制，不顯示
  const used = getQuotaUsed(systemFuncName, projectName);
  return `名額使用狀態：${used} / ${limit} 人`;
};

/** 處理 checkbox 切換 - 加入 quota 檢查 */
const handlePermissionToggle = (systemFuncName, projectName, newValue) => {
  // 如果是「取消勾選」，直接允許
  if (!newValue) {
    permissionMatrix.value[systemFuncName][projectName] = false;
    return;
  }

  // 如果是「勾選」，檢查 quota
  // 被編輯者若為系統管理員/超級管理員，不受 quota 限制
  if (targetUser.value) {
    const targetRoles = targetUser.value.basicInfo.roles || [];
    if (targetRoles.includes('系統管理員') || targetRoles.includes('超級管理員')) {
      permissionMatrix.value[systemFuncName][projectName] = true;
      return;
    }
  }

  if (isQuotaFull(systemFuncName, projectName)) {
    const limit = getQuotaLimit(systemFuncName, projectName);
    toast.error(`「${systemFuncName}」在此建案已達名額上限 ${limit} 人，如需新增更多名額請洽系統管理人員。`);
    return; // 不允許勾選
  }

  permissionMatrix.value[systemFuncName][projectName] = true;
};

// --- 批次授權邏輯 ---

// 可使用批次授權的條件：permissions 欄位可寫，且至少有一個可授權的建案
const canBatchGrant = computed(() => {
  if (getFieldPermission('permissions') !== 'RU') return false;
  return batchGrantableProjects.value.length > 0;
});

// 可批次授權的建案：超管/系管為全部管理建案；一般管理員僅限自己在該建案有「人員管理」權限者
const batchGrantableProjects = computed(() => {
  if (isGodModeAdmin.value) return managedProjects.value;
  return managedProjects.value.filter(p => adminStore.adminScope[p]?.includes('人員管理'));
});

// 各建案下可授予的權限：一般管理員不能授予自己沒有的權限
const batchGrantableSystemsFor = (projectName) => {
  if (isGodModeAdmin.value) return allFunctionNames.value;
  return (adminStore.adminScope[projectName] || []).slice().sort((a, b) => a.localeCompare(b, 'zh-Hant'));
};

const groupSystemsForBatch = (systems) => {
  const groups = permissionCategories.map(cat => ({ ...cat, items: [] }));
  const otherGroup = { id: 'other', label: '其他功能', icon: 'mdi-dots-horizontal', color: 'grey-darken-1', tone: '#6e6e73', items: [] };
  systems.forEach(funcName => {
    const group = groups.find(g => g.keywords.some(k => funcName.includes(k)));
    (group || otherGroup).items.push(funcName);
  });
  const result = groups.filter(g => g.items.length > 0);
  if (otherGroup.items.length > 0) result.push(otherGroup);
  return result;
};

// 每個已選建案一個面板，各自帶可授予的權限分組
const batchProjectPanels = computed(() =>
  batchProjects.value.map(p => ({ project: p, groups: groupSystemsForBatch(batchGrantableSystemsFor(p)) }))
);

// 所有已勾選的「建案 × 權限」組合
const batchSelectedPairs = computed(() => {
  const pairs = [];
  for (const p of batchProjects.value) {
    const projectId = projectStore.nameToIdMap[p];
    for (const sys of (batchSystemsByProject.value[p] || [])) {
      pairs.push({ project: p, projectId, sys });
    }
  }
  return pairs;
});

const batchTotalSelectedCount = computed(() => batchSelectedPairs.value.length);

// 將某建案的權限勾選套用到其他已選建案（僅套用該建案可授予的權限）
const applyBatchSystemsToAll = (sourceProject) => {
  const src = batchSystemsByProject.value[sourceProject] || [];
  batchProjects.value.forEach(p => {
    if (p === sourceProject) return;
    const grantable = batchGrantableSystemsFor(p);
    batchSystemsByProject.value[p] = src.filter(s => grantable.includes(s));
  });
  toast.success(`已將「${sourceProject}」的權限勾選套用到其他建案`);
};

// 公司篩選選項：從人員名單彙整不重複的公司名稱；'__none__' 代表未設定公司者
const batchCompanyOptions = computed(() => {
  const companies = new Set();
  let hasEmpty = false;
  usersWithProjectData.value.forEach(u => {
    if (u.companyName) companies.add(u.companyName);
    else hasEmpty = true;
  });
  const options = Array.from(companies)
    .sort((a, b) => a.localeCompare(b, 'zh-Hant'))
    .map(c => ({ title: c, value: c }));
  if (hasEmpty) options.push({ title: '（未設定公司）', value: '__none__' });
  return options;
});

const batchUserList = computed(() => {
  const q = batchUserSearch.value?.toLowerCase().trim();
  let list = usersWithProjectData.value;
  if (batchCompanyFilter.value) {
    list = batchCompanyFilter.value === '__none__'
      ? list.filter(u => !u.companyName)
      : list.filter(u => u.companyName === batchCompanyFilter.value);
  }
  if (q) {
    list = list.filter(u => (u.name || '').toLowerCase().includes(q) || u.phone.includes(q));
  }
  return list.map(u => {
    const roles = u.roles || [];
    const isTargetAdminRole = roles.includes('超級管理員') || roles.includes('系統管理員');
    const userPerms = adminStore.allUserPermissionsMap.get(u.phone) || {};
    const ownedCount = batchSelectedPairs.value.filter(pair =>
      (pair.projectId && userPerms[pair.projectId]?.systems || []).includes(pair.sys)
    ).length;
    let disabledReason = '';
    if (!isGodModeAdmin.value) {
      if (u.phone === userStore.user?.key) disabledReason = '不可授權自己';
      else if (isTargetAdminRole) disabledReason = '無法編輯管理員';
    }
    return {
      phone: u.phone,
      name: u.name,
      companyName: u.companyName || '',
      accountDisabled: u.disabled === true,
      ownedCount,
      hasAll: batchSelectedPairs.value.length > 0 && ownedCount === batchSelectedPairs.value.length,
      disabledReason
    };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-Hant'));
});

// 建案選擇變動時，同步各建案的權限勾選容器，並自動展開新加入的建案面板
watch(batchProjects, (newList, oldList) => {
  const map = { ...batchSystemsByProject.value };
  Object.keys(map).forEach(p => { if (!newList.includes(p)) delete map[p]; });
  newList.forEach(p => { if (!(p in map)) map[p] = []; });
  batchSystemsByProject.value = map;
  const added = newList.filter(p => !(oldList || []).includes(p));
  if (added.length > 0) {
    batchOpenPanels.value = Array.from(new Set([...batchOpenPanels.value, ...added]));
  }
});

const openBatchGrantDialog = () => {
  batchProjects.value = batchGrantableProjects.value.length === 1 ? [...batchGrantableProjects.value] : [];
  batchSystemsByProject.value = {};
  batchOpenPanels.value = [...batchProjects.value];
  batchSelectedUsers.value = [];
  batchUserSearch.value = '';
  batchCompanyFilter.value = null;
  batchResult.value = null;
  batchProgress.value = '';
  batchDialogVisible.value = true;
};

const isBatchPanelOpen = (project) => batchOpenPanels.value.includes(project);
const toggleBatchPanel = (project) => {
  batchOpenPanels.value = isBatchPanelOpen(project)
    ? batchOpenPanels.value.filter(p => p !== project)
    : [...batchOpenPanels.value, project];
};

const closeBatchDialog = () => {
  if (batchSaving.value) return;
  batchDialogVisible.value = false;
  batchResult.value = null;
};

const selectAllBatchUsers = () => {
  const selectable = batchUserList.value.filter(u => !u.disabledReason).map(u => u.phone);
  batchSelectedUsers.value = Array.from(new Set([...batchSelectedUsers.value, ...selectable]));
};

const handleBatchGrant = async () => {
  // 僅處理有勾選權限的建案；未勾任何權限的建案自動略過
  const projectTargets = batchProjects.value
    .map(name => ({ name, id: projectStore.nameToIdMap[name], systems: batchSystemsByProject.value[name] || [] }))
    .filter(p => p.systems.length > 0);
  if (projectTargets.length === 0) return;
  if (projectTargets.some(p => !p.id)) {
    toast.error('找不到建案資料，請重新整理後再試。');
    return;
  }

  batchSaving.value = true;
  const granted = [];
  const unchanged = [];
  const failed = [];
  const quotaSkipped = {};

  // 預先計算各建案各權限的剩餘名額，批次過程中以本地計數遞減（快取資料在迴圈中不會更新）
  const remaining = {};
  for (const p of projectTargets) {
    for (const sys of p.systems) {
      const limit = getQuotaLimit(sys, p.name);
      remaining[`${p.name}|${sys}`] = (!limit || limit <= 0) ? Infinity : Math.max(0, limit - getQuotaUsed(sys, p.name));
    }
  }

  // 從完整名單取目標，避免搜尋過濾影響已勾選者
  const allUsers = usersWithProjectData.value;
  const targets = batchSelectedUsers.value
    .map(phone => allUsers.find(u => u.phone === phone))
    .filter(Boolean);

  try {
    let index = 0;
    for (const target of targets) {
      index++;
      batchProgress.value = `正在授權 ${index}/${targets.length}：${target.name}`;

      if (!isGodModeAdmin.value) {
        const roles = target.roles || [];
        if (target.phone === userStore.user?.key || roles.includes('超級管理員') || roles.includes('系統管理員')) {
          failed.push({ name: target.name, message: '權限不足，無法編輯此人員' });
          continue;
        }
      }

      // 逐人取最新權限再合併，多個建案一次寫入，避免整份覆寫時弄丟其他建案的既有權限
      const detailResult = await fetchUserDetailsForAdmin(target.phone, adminKey.value);
      if (detailResult.status !== 'success') {
        failed.push({ name: target.name, message: detailResult.message || '讀取人員資料失敗' });
        continue;
      }
      const detail = detailResult.data;
      const perms = JSON.parse(JSON.stringify(detail.permissions || {}));
      const targetRoles = detail.basicInfo.roles || [];
      const targetIsAdmin = targetRoles.includes('超級管理員') || targetRoles.includes('系統管理員');

      const addedByProject = [];
      for (const p of projectTargets) {
        const existingSystems = perms[p.id]?.systems || [];
        const systemsToAdd = [];
        for (const sys of p.systems) {
          if (existingSystems.includes(sys)) continue;
          if (!targetIsAdmin && remaining[`${p.name}|${sys}`] <= 0) {
            const skipKey = `${p.name}／${sys}`;
            if (!quotaSkipped[skipKey]) quotaSkipped[skipKey] = [];
            quotaSkipped[skipKey].push(target.name);
            continue;
          }
          systemsToAdd.push(sys);
        }
        if (systemsToAdd.length === 0) continue;
        if (!perms[p.id]) {
          perms[p.id] = { projectName: p.name, systems: [] };
        }
        perms[p.id].systems = [...existingSystems, ...systemsToAdd];
        addedByProject.push({ projectName: p.name, systemsToAdd });
      }

      if (addedByProject.length === 0) {
        const ownsAll = projectTargets.every(p => {
          const existingSystems = perms[p.id]?.systems || [];
          return p.systems.every(sys => existingSystems.includes(sys));
        });
        if (ownsAll) unchanged.push(target.name);
        continue;
      }

      const updateResult = await updateUserDetailsForAdmin({
        targetUserKey: target.phone,
        adminKey: adminKey.value,
        adminName: userStore.user?.name,
        basicInfo: { phone: target.phone, name: detail.basicInfo.name || target.name },
        permissions: perms,
        isNewUser: false
      });

      if (updateResult.status === 'success') {
        granted.push({
          name: target.name,
          detail: addedByProject.map(a => `${a.projectName}：${a.systemsToAdd.join('、')}`).join('；')
        });
        if (!targetIsAdmin) {
          addedByProject.forEach(a => a.systemsToAdd.forEach(sys => {
            const remKey = `${a.projectName}|${sys}`;
            if (remaining[remKey] !== Infinity) remaining[remKey]--;
          }));
        }
      } else {
        failed.push({ name: target.name, message: updateResult.message || '儲存失敗' });
      }
    }

    batchResult.value = { granted, unchanged, failed, quotaSkipped };

    if (granted.length > 0) {
      toast.success(`批次授權完成：成功 ${granted.length} 人`);
      await loadInitialData({ silent: true });
    } else if (failed.length === 0 && Object.keys(quotaSkipped).length === 0) {
      toast.info('所選人員均已具備所選權限，未進行任何變更。');
    }
  } catch (error) {
    batchResult.value = { granted, unchanged, failed: [...failed, { name: '（處理中斷）', message: error.message }], quotaSkipped };
    toast.error(`批次授權發生錯誤：${error.message}`);
  } finally {
    batchSaving.value = false;
    batchProgress.value = '';
  }
};

const saveSystemFunction = async () => {
  const { valid } = await functionForm.value.validate();
  if (!valid) return;

  savingFunction.value = true;
  try {
    let result;
    if (isNewFunction.value) {
      result = await createSystemFunction(editedFunction.value);
    } else {
      result = await updateSystemFunction(editedFunction.value);
    }

    if (result.status === 'success') {
      toast.success(`權限功能「${editedFunction.value.name}」已儲存。`);
      isFunctionDialogVisible.value = false;
      // 儲存功能後，清除快取並重載
      await loadInitialData({ silent: true });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    savingFunction.value = false;
  }
};

// --- 郵件發送邏輯 ---

/**
 * 開啟郵件對話框
 */
const openEmailDialog = async (user) => {
  // 由於清單中可能沒有密碼資訊，需先獲取完整細節
  try {
    const result = await fetchUserDetailsForAdmin(user.phone, adminKey.value);
    if (result.status === 'success') {
      const fullUser = result.data.basicInfo;
      emailData.value = {
        to: fullUser.email || '',
        name: fullUser.name || '',
        phone: fullUser.phone || '',
        password: fullUser.password || '' 
      };
      
      // 預設選擇帳號開通範本
      selectedTemplateKey.value = 'activation';
      applyTemplate('activation');
      emailDialogVisible.value = true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('開啟郵件對話框失敗:', error);
    toast.error('無法獲取該人員的完整資料 (包含密碼)');
  }
};

/**
 * 切換並套用範本
 */
const applyTemplate = (key) => {
  const template = emailTemplates[key];
  if (!template) return;

  const replaceVars = (str) => {
    return str.replace(/{NAME}/g, emailData.value.name)
              .replace(/{phone}/g, emailData.value.phone)
              .replace(/{password}/g, emailData.value.password);
  };

  emailData.value.subject = replaceVars(template.subject);
  
  if (editor.value) {
    editor.value.commands.setContent(replaceVars(template.content));
  }
};

// 監聽範本選擇變動
watch(selectedTemplateKey, (newKey) => {
  applyTemplate(newKey);
});

/**
 * 呼叫後端發送郵件
 */
const handleSendEmail = async () => {
  if (!emailData.value.to) {
    toast.error('收件人 Email 不可為空');
    return;
  }
  
  sendingEmail.value = true;
  try {
    const functions = getFunctions(undefined, 'asia-east1');
    const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');
    
    // 處理附件：將檔案轉換為 Base64
    const processedAttachments = await Promise.all(attachments.value.map(async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // 格式: data:xxxx/xxxx;base64,..... -> 我們只需要逗號後面的 base64 字串
          const base64Content = reader.result.split(',')[1];
          resolve({
            filename: file.name,
            content: base64Content,
            encoding: 'base64',
            contentType: file.type
          });
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }));
    
    const result = await sendCustomEmail({
      to: emailData.value.to,
      subject: String(emailData.value.subject || '').replace(/\s*\n\s*/g, ' ').trim(),
      htmlContent: editor.value.getHTML(),
      adminKey: userStore.user?.key,
      sessionId: userStore.sessionId,
      attachments: processedAttachments
    });

    if (result.data.status === 'success') {
      toast.success('郵件已成功寄出');
      attachments.value = []; // 清空附件
      emailDialogVisible.value = false;
    } else {
      throw new Error(result.data.message);
    }
  } catch (error) {
    console.error('發送郵件失敗:', error);
    toast.error('發送郵件失敗: ' + error.message);
  } finally {
    sendingEmail.value = false;
  }
};

</script>

<style scoped>
/* 人員管理：沿用 macosUi.css 共用樣式，這裡只放本頁版面（um- 前綴） */
.um-page { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; }
/* 避開左上角全站漢堡鈕 */
.um-bar { padding-left: 58px; }
.um-tabs { padding: 2px 16px 10px; }
.um-searchbar { flex-wrap: wrap; }
.um-searchbar > .mac-vfield { flex: 1 1 240px; }
.um-status-seg .mac-form-seg-btn { gap: 6px; }
.um-seg-count { font-size: 11.5px; font-weight: 500; color: #6e6e73; font-variant-numeric: tabular-nums; }
.um-error { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 0 16px 10px; }
.um-spin { animation: um-spin 0.9s linear infinite; }
@keyframes um-spin { to { transform: rotate(360deg); } }

/* ----- 人員表格 ----- */
.um-table :deep(.v-table__wrapper > table > tbody > tr > td) { padding-top: 6px !important; padding-bottom: 6px !important; }
.um-table :deep(tr.um-row--off > td) { color: #8e8e93; }
.um-table :deep(tr.um-row--off .um-avatar) { opacity: 0.5; }
.um-table :deep(tr.um-row--off .um-person-name) { color: #8e8e93; }

.um-person {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 2px 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.um-avatar {
  display: grid;
  place-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(180deg, #b9bcc4, #8e929c);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
}
.um-person-text { display: flex; flex-direction: column; min-width: 0; }
.um-person-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: #1d1d1f;
  overflow-wrap: anywhere;
}
.um-person:hover .um-person-name { color: #0071e3; }
.um-person-sub { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }

.um-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.um-tag-more { --mac-tag-bg: transparent; --mac-tag-color: #6e6e73; padding-inline: 2px; }
.um-role-btn {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 26px;
  padding: 2px 4px 2px 2px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s;
}
.um-role-btn:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); }
.um-role-btn:disabled { cursor: default; }
.um-role-btn--end { justify-content: flex-end; max-width: 70%; }
.um-role-caret { color: #8e8e93; }
.um-status { display: flex; align-items: center; gap: 8px; }
.um-actions { display: flex; align-items: center; justify-content: flex-end; gap: 2px; flex-shrink: 0; }
/* 解除綁定：平常與其他圖示同色，滑過才轉紅，避免整欄紅色圖示 */
.um-unlink:hover { background: rgba(214, 45, 32, 0.08); color: #d62d20; }

/* ----- 手機清單 ----- */
.um-user-row { align-items: center; }
.um-user-row .um-avatar { width: 36px; height: 36px; font-size: 15px; }
.um-user-row.is-off .um-avatar { opacity: 0.5; }
.um-user-row.is-off .mac-list-title { color: #8e8e93; }
.um-user-row .mac-list-title { flex: 0 1 auto; }
.um-row-side { display: flex; align-items: center; flex-shrink: 0; padding: 10px 0 10px 10px; }
.um-row-chevron { flex-shrink: 0; color: #c7c7cc; }
.um-list .mac-list-row { align-items: center; }

/* ----- 左側清單＋右側內容（建案、角色） ----- */
.um-split { display: flex; flex: 1 1 auto; align-items: stretch; border-top: 1px solid rgba(0, 0, 0, 0.08); }
.um-sidebar {
  flex-shrink: 0;
  width: 232px;
  padding: 10px 8px;
  background: #f6f6f8;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  overflow-y: auto;
}
.um-side-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  padding: 5px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #1d1d1f;
  font: 500 13px/1.35 inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
.um-side-item:hover { background: rgba(0, 0, 0, 0.05); }
.um-side-item.is-active { background: #0071e3; color: #fff; }
.um-side-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.um-side-count { font-size: 12px; color: #6e6e73; font-variant-numeric: tabular-nums; }
.um-side-item.is-active .um-side-count { color: rgba(255, 255, 255, 0.85); }

.um-detail { flex: 1 1 auto; min-width: 0; padding: 14px 16px 24px; background: #f5f5f7; }
.um-detail--form > * { max-width: 720px; }
.um-detail-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin: 0 4px 10px; }
.um-detail-title { font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
.um-detail-select { margin-bottom: 12px; }
.um-detail-foot { display: flex; align-items: center; gap: 8px; margin-top: 16px; }
.um-detail-foot .mac-spacer { flex: 1 1 auto; }

.um-member { display: flex; align-items: flex-start; gap: 12px; padding: 10px 14px; }
.um-member + .um-member { border-top: 1px solid #ececf0; }
.um-member.is-off .um-avatar { opacity: 0.5; }
.um-member.is-off .um-member-perms { opacity: 0.55; }
.um-member-person { flex-shrink: 0; width: 200px; }
.um-member-perms { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 5px; padding-top: 3px; font-size: 13px; }
.um-perm-line { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.um-perm-cat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 2px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--um-tone, #6e6e73);
  white-space: nowrap;
}
.um-perm-cat .v-icon { color: inherit; }
.um-perm-tag {
  --mac-tag-bg: color-mix(in srgb, var(--um-tone, #6e6e73) 11%, transparent);
  --mac-tag-color: var(--um-tone, #48484a);
  font-weight: 500;
  white-space: normal;
}

.um-row-wrap { flex-wrap: wrap; }
.um-grow { flex: 1 1 220px; min-width: 0; max-width: 360px; margin-left: auto; }
.um-field-seg { margin-left: auto; }
.um-fn-name { font-weight: 600; }
.um-fn-desc { display: block; max-width: 440px; white-space: normal; color: #3a3a3c; line-height: 1.45; }
.um-code {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  color: #48484a;
  font: 12px/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

/* ----- 勾選列（權限、角色） ----- */
.um-pop {
  min-width: 200px;
  max-width: 280px;
  max-height: 60vh;
  padding: 10px 10px 8px;
  border-radius: 10px;
  background: rgba(250, 250, 252, 0.98);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
  overflow-y: auto;
}
.um-pop .mac-sheet-label { margin: 0 4px 6px; overflow-wrap: anywhere; }
.um-pop-empty { padding: 4px; font-size: 13px; }
.um-check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.35;
  cursor: pointer;
}
.um-check-row:hover:not(.is-disabled) { background: rgba(0, 0, 0, 0.04); }
.um-check-row.is-disabled { color: #a1a1a6; cursor: default; }
.um-check-row .mac-check { margin-top: 1px; }
.um-check-text { display: flex; flex-direction: column; min-width: 0; overflow-wrap: anywhere; }
.um-quota { font-size: 11px; color: #6e6e73; }
.um-quota.is-full { color: #c2410c; font-weight: 600; }
.um-page .mac-check:disabled,
.um-sheet .mac-check:disabled,
.um-pop .mac-check:disabled { opacity: 0.45; cursor: default; }

/* ----- 視窗 ----- */
.um-sheet { display: flex; flex-direction: column; }
.um-sheet--tall { height: min(86vh, 860px); }
.um-sheet-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.um-sheet-pad { padding: 14px 16px 16px; }
.um-sheet .mac-sheet-head .mac-sheet-close:disabled { opacity: 0.4; cursor: default; }
.um-sheet--tall .um-sheet-body { overflow: hidden; }

.um-edit { display: grid; grid-template-columns: 340px minmax(0, 1fr); height: 100%; }
.um-edit--even { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.um-edit--single { grid-template-columns: minmax(0, 520px); justify-content: center; }
.um-edit-side,
.um-edit-main { min-height: 0; padding: 14px 16px 18px; overflow-y: auto; }
.um-edit-side { border-right: 1px solid rgba(0, 0, 0, 0.08); }
.um-edit--single .um-edit-side { border-right: 0; }

.um-label-first { margin-top: 0; }
.um-label-note { color: #0058b0; font-weight: 500; }
.um-step {
  display: inline-grid;
  place-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0071e3;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.um-fields { display: flex; flex-direction: column; gap: 10px; }
.um-field { min-width: 0; }
.um-field > .mac-sheet-label { display: block; margin-bottom: 4px; }
.um-group-gap { margin-top: 12px; }
.um-switch-row { cursor: pointer; }
.um-row-sub { display: block; font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.um-row-sub.is-danger { color: #b3261b; }
.um-link-row {
  width: 100%;
  border-width: 1px 0 0;
  border-style: solid;
  border-color: #ececf0;
  background: none;
  color: inherit;
  font-family: inherit;
  text-align: left;
}

.um-panel-search { margin-bottom: 10px; }
.um-panels { display: flex; flex-direction: column; gap: 8px; }
.um-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 6px 12px 6px 14px;
  cursor: pointer;
  user-select: none;
}
.um-panel-head:hover { background: #fafafc; }
.um-panel-name { flex: 1 1 auto; min-width: 0; font-size: 13.5px; font-weight: 600; overflow-wrap: anywhere; }
.um-chevron { flex-shrink: 0; color: #8e8e93; transition: transform 0.15s; }
.um-chevron.is-open { transform: rotate(90deg); }
.um-panel-body { padding: 2px 14px 12px; border-top: 1px solid #ececf0; }
.um-perm-group { margin-top: 10px; }
.um-perm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0 10px; margin-top: 3px; }
.um-perm-grid--2 { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }

/* 批次授權 */
.um-batch-filters { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; margin-bottom: 10px; }
.um-batch-user { display: flex; align-items: center; gap: 10px; padding: 8px 14px; cursor: pointer; }
.um-batch-user + .um-batch-user { border-top: 1px solid #ececf0; }
.um-batch-user:hover:not(.is-disabled) { background: #fafafc; }
.um-batch-user.is-disabled { color: #a1a1a6; cursor: default; }
.um-batch-user-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.um-batch-user-name { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 13.5px; font-weight: 500; overflow-wrap: anywhere; }
.um-batch-user-sub { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.um-batch-user.is-disabled .um-batch-user-sub { color: #a1a1a6; }
.um-progress { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: #6e6e73; }
.um-result { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.um-callout-title { font-weight: 600; margin-bottom: 2px; }
.um-callout--success { background: rgba(52, 199, 89, 0.13); }
.um-callout--success > .v-icon { color: #1f7a36; }

/* 權限功能視窗 */
.um-quota-list { max-height: 300px; overflow-y: auto; }
.um-quota-row { flex-wrap: nowrap; }
.um-quota-row .mac-form-row-main { overflow-wrap: anywhere; }
.um-quota-row > .um-quota-input { flex: 0 0 110px; max-width: 110px; margin-left: auto; }
.um-quota-input input { text-align: right; }

/* 通知信 */
.um-mail-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px 12px; }
.um-field--wide { grid-column: 1 / -1; }
.um-editor {
  margin-top: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
  overflow: hidden;
}
.um-editor-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 5px 6px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.um-editor-bar .mac-icon-btn.is-on { background: rgba(0, 113, 227, 0.12); color: #0071e3; }
.um-editor-sep { width: 1px; height: 16px; margin: 0 4px; background: rgba(0, 0, 0, 0.12); }
.um-color-btn { position: relative; overflow: hidden; }
.um-color-btn input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.um-editor-content { min-height: 200px; max-height: 40vh; padding: 12px; font-size: 14px; line-height: 1.6; overflow-y: auto; }
.um-editor-content :deep(.tiptap) { min-height: 176px; outline: none; }
.um-editor-content :deep(.tiptap p) { margin-bottom: 0.5em; }
.um-editor-content :deep(.tiptap ul) { padding-left: 1.5em; }
.um-editor-content :deep(.tiptap a) { color: #0071e3; text-decoration: underline; }

/* 確認視窗 */
.um-alert { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 20px 18px; text-align: center; }
.um-alert-title { font-size: 15px; font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }

/* ----- 手機／平板 ----- */
@media (max-width: 959.98px) {
  .um-tabs { padding: 2px 12px 10px; }
  .um-status-seg { display: flex; flex: 1 1 100%; }
  .um-status-seg .mac-form-seg-btn { flex: 1 1 0; min-width: 0; padding: 0 6px; height: 30px; }
  .um-split { display: block; }
  .um-grow { max-width: none; margin-left: 0; }
  .um-list { padding-bottom: 24px; }
  .um-detail { padding: 12px 12px 24px; }
  .um-member { flex-wrap: wrap; }
  .um-member-person { flex: 1 1 auto; width: auto; }
  .um-member-perms { order: 3; flex-basis: 100%; padding-top: 0; }
  .um-field-seg { display: flex; flex: 1 1 100%; margin-left: 0; }
  .um-field-seg .mac-form-seg-btn { flex: 1 1 0; min-width: 0; padding: 0 4px; height: 30px; }

  /* 全螢幕視窗：直角、標題列避開左上角漢堡鈕（z-index 高於視窗）、單欄捲動 */
  .um-sheet.um-sheet--full { border-radius: 0 !important; }
  .um-sheet--full .mac-sheet-head { min-height: 56px; padding-left: 58px; }
  .um-sheet--full .mac-sheet-foot { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
  .um-edit,
  .um-edit--even { display: block; height: auto; }
  .um-edit-side,
  .um-edit-main { padding: 14px 12px 6px; overflow: visible; }
  .um-edit-side { border-right: 0; }
  .um-edit-main { padding-bottom: 20px; }
  .um-perm-grid,
  .um-perm-grid--2 { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .um-check-row { padding: 8px 4px; font-size: 14.5px; }
  .um-check-row .mac-check,
  .um-batch-user .mac-check,
  .um-panel-head .mac-check { width: 20px; height: 20px; border-radius: 5px; }
  .um-panel-head { min-height: 48px; }
  .um-panel-name { font-size: 15px; }
  .um-batch-user { padding: 10px 12px; }
  .um-batch-user-name { font-size: 15px; }
  .um-mail-grid { grid-template-columns: minmax(0, 1fr); }
  /* iOS 輸入框字級小於 16px 會在聚焦時自動放大畫面 */
  .um-page .mac-form-input,
  .um-sheet .mac-form-input,
  .um-sheet .mac-form-unit input { font-size: 16px; }
  .um-page .mac-form-input,
  .um-sheet .mac-form-input { height: 36px; }
}
@media (max-width: 600px) {
  .um-bar { padding-left: 58px; }
  .um-batch-filters { grid-template-columns: minmax(0, 1fr); }
}
</style>
