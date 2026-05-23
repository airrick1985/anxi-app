<template>
    <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" fullscreen
        transition="dialog-bottom-transition">
        <v-card class="d-flex flex-column bg-grey-lighten-5">
            <v-toolbar color="white" density="compact" elevation="1">
                <v-btn icon="mdi-close" @click="$emit('update:show', false)"></v-btn>
                <v-toolbar-title class="text-subtitle-1 font-weight-bold text-primary text-truncate">
                    {{ projectName || '建案' }}-客資 - {{ guestData.latestName }}
                    <v-chip v-if="guestData.isDeleted" color="red" size="x-small" class="ml-2">已刪除</v-chip>
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <!-- 參考建案：關聯模式下顯示「取消關聯」，非關聯模式顯示原本的刪除/復原 -->
                <v-btn v-if="isLinkedMode" color="orange-darken-1" size="small" variant="outlined"
                    prepend-icon="mdi-link-variant-off" @click="handleUnlinkProject" :loading="isUnlinking"
                    class="mr-2">
                    取消關聯
                </v-btn>
                <v-btn v-else-if="guestData.isDeleted && canEdit" color="success" size="small" variant="flat"
                    prepend-icon="mdi-restore" @click="handleRestoreCustomer" :loading="isRestoringCustomer"
                    class="mr-2">
                    復原客戶
                </v-btn>
                <v-btn v-else-if="canEdit" color="error" size="small" variant="outlined" prepend-icon="mdi-delete"
                    @click="handleDeleteCustomer" :loading="isDeletingCustomer" class="mr-2">
                    刪除客戶
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-0 flex-grow-1" style="overflow-y: auto; overflow-x: hidden;">
                <v-container fluid class="pa-2 pa-md-4">
                    <v-row :class="{ 'fill-height': $vuetify.display.mdAndUp }" class="ma-0">
                        <v-col cols="12" md="4" :class="{ 'fill-height': $vuetify.display.mdAndUp }">
                            <v-card class="mb-4" :class="{ 'fill-height': $vuetify.display.mdAndUp }" elevation="1">
                                <v-card-title
                                    class="bg-blue-grey-lighten-5 text-subtitle-1 font-weight-bold d-flex align-center justify-space-between">
                                    <div>
                                        <v-icon start color="blue-grey">mdi-account-details</v-icon>
                                        基本資料
                                    </div>

                                    <div>
                                        <v-tooltip text="編輯" location="top" v-if="!isEditingProfile">
                                            <template v-slot:activator="{ props }">
                                                <v-btn v-bind="props" icon="mdi-pencil" variant="text" size="small"
                                                    color="primary" @click="startEditProfile"></v-btn>
                                            </template>
                                        </v-tooltip>
                                        <div v-else class="d-flex align-center">
                                            <v-btn color="grey-darken-1" variant="text" size="small" class="mr-2"
                                                @click="cancelEditProfile" :disabled="isSavingProfile">取消</v-btn>
                                            <v-btn color="success" variant="elevated" size="small"
                                                prepend-icon="mdi-content-save" @click="saveProfile"
                                                :loading="isSavingProfile">儲存</v-btn>
                                        </div>
                                    </div>
                                </v-card-title>

                                <v-card-text class="pt-4"
                                    :style="$vuetify.display.mdAndUp ? 'overflow-y: auto; max-height: calc(100vh - 150px);' : ''">
                                    <div v-if="!isEditingProfile">
                                        <!-- 銷售人員欄位 -->
                                        <div class="info-row mb-3">
                                            <span class="text-caption text-grey">銷售人員</span>
                                            <div class="d-flex flex-wrap gap-2 align-center">
                                                <template v-if="salesPersonNames.length > 0">
                                                    <div v-for="(name, idx) in salesPersonNames" :key="idx"
                                                        class="d-flex align-center">
                                                        <v-chip size="small" variant="flat"
                                                            :color="name === guestData.latestSalesName ? 'primary' : 'grey-lighten-2'"
                                                            :text-color="name === guestData.latestSalesName ? 'white' : 'grey-darken-3'"
                                                            :prepend-icon="name === guestData.latestSalesName ? 'mdi-star' : ''">
                                                            {{ name }}
                                                            <template v-if="name === guestData.latestSalesName">
                                                                <v-tooltip text="目前負責人員" location="top">
                                                                    <template v-slot:activator="{ props }">
                                                                        <v-icon v-bind="props" size="x-small" class="ml-1">mdi-information</v-icon>
                                                                    </template>
                                                                </v-tooltip>
                                                            </template>
                                                        </v-chip>
                                                    </div>
                                                </template>
                                                <div v-else class="text-body-2 text-grey-lighten-1 font-italic">
                                                    未設定
                                                </div>
                                            </div>
                                        </div>

                                        <v-divider class="my-3"></v-divider>

                                        <div class="info-row mb-3">
                                            <span class="text-caption text-grey">姓名</span>
                                            <div class="d-flex align-center">
                                                <div class="text-body-1 font-weight-medium mr-2">{{ displayedName }}
                                                </div>

                                                <v-chip v-if="getProfileDisplayValue('性別')" size="x-small"
                                                    variant="flat" class="font-weight-bold px-2"
                                                    :color="getProfileDisplayValue('性別') === '男' ? 'blue-lighten-5' : (getProfileDisplayValue('性別') === '女' ? 'pink-lighten-5' : 'grey-lighten-4')"
                                                    :class="getProfileDisplayValue('性別') === '男' ? 'text-blue-darken-3' : (getProfileDisplayValue('性別') === '女' ? 'text-pink-darken-3' : 'text-grey-darken-3')">
                                                    <v-icon start size="small" class="mr-1">
                                                        {{ getProfileDisplayValue('性別') === '男' ? 'mdi-gender-male' :
                                                            (getProfileDisplayValue('性別') ===
                                                                '女' ? 'mdi-gender-female' : 'mdi-help') }}
                                                    </v-icon>
                                                    {{ getProfileDisplayValue('性別') }}
                                                </v-chip>

                                                <v-chip v-if="getProfileDisplayValue('年齡')" size="x-small"
                                                    variant="flat" color="teal-lighten-5"
                                                    class="text-teal-darken-3 font-weight-bold px-2 ml-1">

                                                    {{ getProfileDisplayValue('年齡') }}歲
                                                </v-chip>


                                            </div>
                                        </div>
                                        <div class="info-row mb-3">

                                            <span class="text-caption text-grey">主電話</span>
                                            <div class="text-h6 text-primary">
                                                <v-icon size="x-small" start>mdi-phone</v-icon>
                                                <a :href="`tel:${guestData.phone}`"
                                                    class="text-decoration-none text-primary">
                                                    {{ guestData.phone }}
                                                </a>
                                            </div>
                                        </div>

                                        <div class="info-row mb-3">
                                            <span class="text-caption text-grey">目前居住</span>

                                            <div class="d-flex flex-column">
                                                <template v-if="addressList.length > 0">
                                                    <div v-for="(addr, idx) in addressList" :key="idx" class="mb-1">
                                                        <div v-if="idx === 0"
                                                            class="text-body-1 font-weight-bold text-high-emphasis">
                                                            {{ addr.fullAddress }}
                                                        </div>
                                                        <div v-else
                                                            class="text-caption text-grey d-flex align-center mt-1">
                                                            <v-icon size="x-small" class="mr-1">mdi-history</v-icon>
                                                            <span class="mr-2">{{ addr.date }}</span>
                                                            <span>{{ addr.fullAddress }}</span>
                                                        </div>
                                                    </div>
                                                </template>

                                                <div v-else class="text-body-2 text-grey-lighten-1 font-italic">
                                                    未填寫
                                                </div>
                                            </div>
                                        </div>

                                        <div class="info-row mb-3">
                                            <span class="text-caption text-grey">職業 / 任職公司</span>

                                            <div class="d-flex flex-column">
                                                <template v-if="careerList.length > 0">
                                                    <div v-for="(item, idx) in careerList" :key="idx" class="mb-1">
                                                        <div v-if="idx === 0"
                                                            class="text-body-1 font-weight-bold text-high-emphasis">
                                                            {{ item.full }}
                                                        </div>
                                                        <div v-else
                                                            class="text-caption text-grey d-flex align-center mt-1">
                                                            <v-icon size="x-small" class="mr-1">mdi-history</v-icon>
                                                            <span class="mr-2">{{ item.date }}</span>
                                                            <span>{{ item.full }}</span>
                                                        </div>
                                                    </div>
                                                </template>

                                                <div v-else class="text-body-2 text-grey-lighten-1 font-italic">
                                                    未填寫
                                                </div>
                                            </div>
                                        </div>

                                        <v-divider class="my-4"></v-divider>

                                        <div class="d-flex align-center justify-space-between mb-2">
                                            <span class="text-caption text-grey">其他聯絡電話</span>
                                            <v-btn size="small" color="primary" variant="text" prepend-icon="mdi-plus"
                                                @click="openAddPhoneDialog">
                                                新增
                                            </v-btn>
                                        </div>




                                        <div v-if="guestData.otherPhones && guestData.otherPhones.length > 0">
                                            <div v-for="(p, idx) in guestData.otherPhones" :key="idx"
                                                class="mb-3 pa-3 bg-grey-lighten-5 rounded">
                                                <div class="d-flex align-center justify-space-between">
                                                    <span class="font-weight-bold">{{ p.name }}</span>
                                                    <v-chip size="small" v-if="p.relation">{{ p.relation }}</v-chip>
                                                </div>

                                                <div class="text-body-2 mt-1 d-flex align-center">
                                                    <v-icon size="small" start>mdi-phone</v-icon>
                                                    <a :href="`tel:${p.phone}`"
                                                        class="text-decoration-none text-high-emphasis font-weight-medium">
                                                        {{ p.phone }}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="text-grey text-caption font-italic">無其他聯絡電話</div>

                                        <v-divider class="my-4"></v-divider>

                                        <div v-if="guestData.profile" class="mt-4">
                                            <v-expansion-panels v-model="detailsPanel" variant="accordion"
                                                class="details-accordion">
                                                <v-expansion-panel elevation="0" class="bg-transparent">
                                                    <v-expansion-panel-title class="pa-0 min-height-0 bg-transparent">
                                                        <template v-slot:default="{ expanded }">
                                                            <div class="d-flex align-center">
                                                                <v-icon size="small"
                                                                    :color="expanded ? 'primary' : 'grey-darken-1'"
                                                                    class="mr-1">
                                                                    mdi-text-box-search-outline
                                                                </v-icon>
                                                                <span class="text-caption font-weight-bold"
                                                                    :class="expanded ? 'text-primary' : 'text-grey-darken-2'">
                                                                    詳細需求
                                                                </span>
                                                                <v-chip size="x-small" variant="tonal" class="ml-2"
                                                                    color="grey" v-if="!expanded">
                                                                    點擊展開
                                                                </v-chip>
                                                            </div>
                                                        </template>
                                                    </v-expansion-panel-title>

                                                    <v-expansion-panel-text class="pa-0 mt-2">
                                                        <div
                                                            class="bg-grey-lighten-4 rounded pa-2 border border-dashed">
                                                            <v-row dense>
                                                                <v-col v-for="field in sortedProfileFields"
                                                                    :key="field.key" cols="12" lg="6" class="py-1">
                                                                    <div class="d-flex flex-column">
                                                                        <span class="text-caption text-grey"
                                                                            style="font-size: 0.7rem;">{{ field.label
                                                                            }}</span>
                                                                        <div class="text-body-2 font-weight-medium text-grey-darken-3"
                                                                            style="min-height: 24px; line-height: 1.4;">
                                                                            <template
                                                                                v-if="Array.isArray(guestData.profile[field.label])">
                                                                                <div v-if="guestData.profile[field.label].length > 0"
                                                                                    class="d-flex flex-wrap gap-1">
                                                                                    <v-chip
                                                                                        v-for="item in guestData.profile[field.label]"
                                                                                        :key="item" size="small"
                                                                                        variant="tonal"
                                                                                        color="blue-grey-darken-1"
                                                                                        class="px-1"
                                                                                        style="height: 20px;">
                                                                                        {{ item }}
                                                                                    </v-chip>
                                                                                </div>
                                                                                <span v-else
                                                                                    class="text-grey-lighten-1">-</span>
                                                                            </template>
                                                                            <template v-else>
                                                                                {{ guestData.profile[field.label] || '-'
                                                                                }}
                                                                            </template>
                                                                        </div>
                                                                    </div>
                                                                </v-col>
                                                            </v-row>
                                                        </div>
                                                    </v-expansion-panel-text>
                                                </v-expansion-panel>
                                            </v-expansion-panels>
                                        </div>


                                        <!-- ========== 參考建案區塊 ========== -->
                                        <v-divider class="my-4"></v-divider>
                                        <div class="d-flex align-center justify-space-between mb-2">
                                            <div class="d-flex align-center">
                                                <v-icon size="small" color="indigo"
                                                    class="mr-1">mdi-office-building-marker</v-icon>
                                                <span class="text-caption text-grey font-weight-bold">參考建案</span>
                                            </div>
                                            <v-btn v-if="!isEditingLinkedProjects && availableLinkedProjects.length > 0"
                                                icon="mdi-pencil" variant="text" size="small" color="primary"
                                                @click="startEditLinkedProjects"></v-btn>
                                            <div v-if="isEditingLinkedProjects" class="d-flex align-center">
                                                <v-btn color="grey-darken-1" variant="text" size="small" class="mr-2"
                                                    @click="cancelEditLinkedProjects"
                                                    :disabled="isSavingLinkedProjects">取消</v-btn>
                                                <v-btn color="success" variant="elevated" size="small"
                                                    prepend-icon="mdi-content-save" @click="saveLinkedProjects"
                                                    :loading="isSavingLinkedProjects">儲存</v-btn>
                                            </div>
                                        </div>

                                        <!-- 關聯模式 Banner -->
                                        <v-alert v-if="isLinkedMode" type="info" variant="tonal" density="compact"
                                            class="mb-3" border="start">
                                            <div class="text-caption">
                                                <v-icon size="small" start>mdi-link-variant</v-icon>
                                                此客戶資料來自 <strong>{{ sourceProjectName }}</strong>
                                            </div>
                                        </v-alert>

                                        <!-- 主歸屬建案 -->
                                        <div class="mb-2">
                                            <div class="d-flex align-center">
                                                <span class="text-caption text-grey">主歸屬建案</span>
                                                <v-btn v-if="!isEditingMainProject && availableMainProjects.length > 1"
                                                    icon="mdi-pencil" size="x-small" variant="text" density="compact"
                                                    class="ml-1" @click="startEditMainProject"></v-btn>
                                            </div>
                                            <div class="mt-1">
                                                <template v-if="!isEditingMainProject">
                                                    <v-chip size="small" color="indigo" variant="flat" label
                                                        prepend-icon="mdi-home-city">
                                                        {{ mainProjectName }}
                                                    </v-chip>
                                                </template>
                                                <template v-else>
                                                    <div class="d-flex align-center flex-wrap gap-2">
                                                        <v-select v-model="editingMainProjectId"
                                                            :items="availableMainProjects" item-title="name"
                                                            item-value="id" density="compact" variant="outlined"
                                                            hide-details style="min-width: 220px; max-width: 280px"
                                                            prepend-inner-icon="mdi-home-city"></v-select>
                                                        <v-btn size="small" variant="text"
                                                            :disabled="isSavingMainProject"
                                                            @click="cancelEditMainProject">取消</v-btn>
                                                        <v-btn size="small" color="primary"
                                                            :loading="isSavingMainProject"
                                                            :disabled="!editingMainProjectId || editingMainProjectId === mainProjectId"
                                                            @click="confirmChangeMainProject">變更</v-btn>
                                                    </div>
                                                </template>
                                            </div>
                                        </div>

                                        <!-- 變更主歸屬建案確認 Dialog -->
                                        <v-dialog v-model="confirmMainProjectDialog" max-width="460">
                                            <v-card>
                                                <v-card-title class="text-h6">變更主歸屬建案</v-card-title>
                                                <v-card-text>
                                                    確定將主歸屬建案由
                                                    <strong>「{{ mainProjectName }}」</strong>
                                                    變更為
                                                    <strong class="text-indigo">「{{ editingMainProjectName }}」</strong>
                                                    ?
                                                    <div class="mt-3 text-caption text-grey">
                                                        • 原主建案會自動變為「關聯建案」<br>
                                                        • 若新主建案已存在同電話且同銷售人員的客戶，將自動合併資料<br>
                                                        • 此操作會同步更新客戶文件的 projectId，影響後續查詢
                                                    </div>
                                                </v-card-text>
                                                <v-card-actions>
                                                    <v-spacer></v-spacer>
                                                    <v-btn variant="text" :disabled="isSavingMainProject"
                                                        @click="confirmMainProjectDialog = false">取消</v-btn>
                                                    <v-btn color="primary" :loading="isSavingMainProject"
                                                        @click="saveMainProjectChange">確認變更</v-btn>
                                                </v-card-actions>
                                            </v-card>
                                        </v-dialog>

                                        <!-- 唯讀模式：顯示已關聯建案 -->
                                        <div v-if="!isEditingLinkedProjects">
                                            <span class="text-caption text-grey">關聯建案</span>
                                            <div v-if="guestData.linkedProjectIds && guestData.linkedProjectIds.length > 0"
                                                class="d-flex flex-wrap gap-1 mt-1">
                                                <v-chip v-for="lpid in guestData.linkedProjectIds" :key="lpid"
                                                    size="small" color="teal" variant="tonal" label
                                                    prepend-icon="mdi-link-variant">
                                                    {{ projectStore.idToNameMap[lpid] || lpid }}
                                                </v-chip>
                                            </div>
                                            <div v-else class="text-caption text-grey-lighten-1 font-italic mt-1">
                                                尚未關聯其他建案
                                            </div>
                                        </div>

                                        <!-- 編輯模式：勾選建案 -->
                                        <div v-else>
                                            <span class="text-caption text-grey">勾選關聯建案</span>
                                            <div v-if="availableLinkedProjects.length > 0" class="mt-1">
                                                <v-checkbox v-for="proj in availableLinkedProjects" :key="proj.id"
                                                    v-model="editingLinkedProjectIds" :value="proj.id"
                                                    :label="proj.name" density="compact" hide-details color="teal"
                                                    class="mb-n2"></v-checkbox>
                                            </div>
                                            <div v-else class="text-caption text-grey-lighten-1 font-italic mt-1">
                                                您目前沒有其他建案的客資系統權限
                                            </div>
                                        </div>
                                        <!-- ========== 參考建案區塊結束 ========== -->

                                        <div class="mt-6 pt-4 border-t text-caption text-grey-lighten-1">
                                            <div>建立時間: {{ guestData.createdAt ? new
                                                Date(guestData.createdAt).toLocaleString() : '-' }}</div>

                                        </div>
                                    </div>

                                    <v-form v-else ref="profileForm">
                                        <!-- 銷售人員選擇器（只有"客資系統-櫃台"權限才能修改） -->
                                        <div v-if="hasCounterPermission" class="mb-3">
                                            <v-select
                                                v-model="editingData.selectedSalesPersons"
                                                label="銷售人員"
                                                :items="salesPersonList"
                                                item-title="name"
                                                item-value="phone"
                                                multiple
                                                density="compact"
                                                variant="outlined"
                                                hide-details="auto"
                                                chips
                                                clearable>
                                            </v-select>

                                            <!-- 選擇目前負責的銷售人員 -->
                                            <div v-if="editingData.selectedSalesPersons && editingData.selectedSalesPersons.length > 0" class="mt-3">
                                                <v-select
                                                    v-model="editingData.latestSalesPhone"
                                                    label="目前負責人員（帶星號★）"
                                                    :items="getSalesPersonChipOptions()"
                                                    item-title="label"
                                                    item-value="phone"
                                                    density="compact"
                                                    variant="outlined"
                                                    hide-details="auto"
                                                    :prepend-icon="'mdi-star'">
                                                </v-select>
                                            </div>
                                        </div>

                                        <v-text-field label="姓名" v-model="editingData.latestName" variant="outlined"
                                            density="compact" :rules="[v => !!v || '必填']" class="mb-3"></v-text-field>

                                        <div class="mb-4">
                                            <div class="text-caption text-grey mb-1">性別</div>
                                            <v-btn-toggle v-model="editingData.profile['性別']" color="primary"
                                                variant="outlined" density="compact" divided mandatory>
                                                <v-btn value="男" size="small" prepend-icon="mdi-gender-male">男</v-btn>
                                                <v-btn value="女" size="small" prepend-icon="mdi-gender-female">女</v-btn>
                                            </v-btn-toggle>
                                        </div>

                                        <v-select v-if="fieldSettings['age']" label="年齡區間"
                                            v-model="editingData.profile['年齡']" :items="fieldSettings['age'].options"
                                            density="compact" variant="outlined" hide-details="auto" class="mb-3"
                                            placeholder="請選擇年齡區間"></v-select>

                                        <v-divider class="mb-4 border-dashed"></v-divider>

                                        <div class="text-caption text-primary font-weight-bold mb-2">
                                            <v-icon size="small" start>mdi-home-map-marker</v-icon>居住地址
                                        </div>
                                        <v-row dense>
                                            <v-col cols="6">
                                                <v-autocomplete label="城市" v-model="editingData.profile['居住城市']"
                                                    :items="cityOptions" density="compact" variant="outlined"
                                                    hide-details="auto" class="mb-2" placeholder="請選擇"></v-autocomplete>
                                            </v-col>
                                            <v-col cols="6">
                                                <v-autocomplete label="鄉鎮市區" v-model="editingData.profile['居住鄉鎮市區']"
                                                    :items="districtOptions" :disabled="!editingData.profile['居住城市']"
                                                    density="compact" variant="outlined" hide-details="auto"
                                                    class="mb-2" placeholder="請選擇"
                                                    no-data-text="請先選擇城市"></v-autocomplete>
                                            </v-col>
                                            <v-col cols="12">
                                                <v-text-field label="詳細地址" v-model="editingData.profile['居住詳細地址']"
                                                    density="compact" variant="outlined" hide-details="auto"
                                                    class="mb-3" placeholder="街道巷弄號樓"></v-text-field>
                                            </v-col>
                                        </v-row>

                                        <div class="text-caption text-primary font-weight-bold mb-2 mt-2">
                                            <v-icon size="small" start>mdi-briefcase</v-icon>職業資訊
                                        </div>
                                        <v-row dense>
                                            <v-col cols="6">
                                                <v-select label="職業" v-model="occupationSelection"
                                                    :items="occupationOptionsWithOther" density="compact"
                                                    variant="outlined" hide-details="auto" class="mb-2"
                                                    clearable></v-select>
                                                <v-text-field v-if="occupationSelection === '其他'"
                                                    v-model="customOccupation" label="請輸入職業" density="compact"
                                                    variant="outlined" hide-details="auto" class="mb-2"
                                                    placeholder="自行填寫職業"></v-text-field>
                                            </v-col>
                                            <v-col cols="6">
                                                <v-text-field label="任職公司" v-model="editingData.profile['任職公司']"
                                                    density="compact" variant="outlined" hide-details="auto"
                                                    class="mb-2"></v-text-field>
                                            </v-col>
                                        </v-row>

                                        <v-divider class="my-4 border-dashed"></v-divider>

                                        <div class="text-caption text-primary font-weight-bold mb-2 mt-2">
                                            <v-icon size="small" start>mdi-text-box-search-outline</v-icon>詳細需求
                                        </div>
                                        <v-row dense>
                                            <v-col v-for="field in sortedProfileFields" :key="field.key" cols="12"
                                                sm="6">
                                                <v-combobox v-if="vipFieldSettings[field.key]?.allowCustom"
                                                    v-model="editingData.profile[field.label]" :label="field.label"
                                                    :items="vipFieldSettings[field.key]?.options || []"
                                                    :multiple="vipFieldSettings[field.key]?.selectionMode === 'multiple'"
                                                    chips closable-chips density="compact" variant="outlined"
                                                    hide-details="auto" class="mb-2"></v-combobox>
                                                <v-select v-else v-model="editingData.profile[field.label]"
                                                    :label="field.label"
                                                    :items="vipFieldSettings[field.key]?.options || []"
                                                    :multiple="vipFieldSettings[field.key]?.selectionMode === 'multiple'"
                                                    :chips="vipFieldSettings[field.key]?.selectionMode === 'multiple'"
                                                    density="compact" variant="outlined" hide-details="auto"
                                                    class="mb-2" clearable></v-select>
                                            </v-col>
                                        </v-row>

                                        <v-divider class="my-4 border-dashed"></v-divider>

                                        <div class="d-flex justify-space-between align-center mb-2">
                                            <span class="text-subtitle-2">其他聯絡電話</span>
                                            <v-btn size="small" color="primary" variant="text" prepend-icon="mdi-plus"
                                                @click="addPhoneField">新增</v-btn>
                                        </div>

                                        <div v-for="(p, idx) in editingData.otherPhones" :key="idx"
                                            class="mb-4 pa-3 border rounded bg-grey-lighten-5">
                                            <div class="d-flex justify-space-between mb-2">
                                                <span class="text-caption">聯絡人 {{ idx + 1 }}</span>
                                                <v-btn icon="mdi-delete" size="small" color="grey" variant="text"
                                                    @click="removePhoneField(idx)"></v-btn>
                                            </div>
                                            <v-row dense>
                                                <v-col cols="6">
                                                    <v-text-field label="姓名" v-model="p.name" density="compact"
                                                        variant="outlined" hide-details class="mb-2"></v-text-field>
                                                </v-col>
                                                <v-col cols="6">
                                                    <v-text-field label="關係" v-model="p.relation" density="compact"
                                                        variant="outlined" hide-details class="mb-2"></v-text-field>
                                                </v-col>
                                                <v-col cols="12">
                                                    <v-text-field label="電話" v-model="p.phone" density="compact"
                                                        variant="outlined" hide-details></v-text-field>
                                                </v-col>
                                            </v-row>
                                        </div>
                                    </v-form>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="8" :class="{ 'fill-height d-flex flex-column': $vuetify.display.mdAndUp }">
                            <v-card :class="{ 'flex-grow-1 d-flex flex-column': $vuetify.display.mdAndUp }"
                                elevation="1" style="min-height: 0;">
                                <v-card-title
                                    class="text-subtitle-1 font-weight-bold border-b d-flex align-center justify-space-between bg-grey-lighten-4 px-2 px-md-4">
                                    <div class="d-flex align-center flex-grow-1" style="min-width: 0;"> <span
                                            class="text-truncate">洽談紀錄 ({{
                                                guestData.interactionLogs?.length || 0 }})</span>

                                        <v-divider vertical class="mx-2 d-none d-sm-flex"
                                            v-if="guestData.updatedAt"></v-divider>
                                        <span v-if="guestData.updatedAt"
                                            class="text-caption text-grey-darken-1 font-weight-regular text-truncate d-none d-sm-inline-flex">
                                            <v-icon size="x-small" start color="grey">mdi-clock-edit-outline</v-icon>
                                            最後更新：{{ formatFullDateTime(guestData.updatedAt) }}
                                        </span>
                                    </div>

                                    <v-btn color="teal" variant="flat" size="small" class="ml-2 flex-shrink-0"
                                        @click="openAddLogDialog">
                                        <v-icon :start="!$vuetify.display.xs">mdi-pen-plus</v-icon>
                                        <span class="d-none d-sm-inline">新增紀錄</span>
                                    </v-btn>
                                </v-card-title>

                                <v-card-text class="pa-0" style="overflow-y: auto;">
                                    <div class="pa-4 d-flex flex-column gap-3">

                                        <div v-if="!guestData.interactionLogs?.length"
                                            class="text-center text-grey pa-4">
                                            尚無洽談紀錄
                                        </div>

                                        <v-card v-for="log in guestData.interactionLogs" :key="log.logId"
                                            variant="outlined" class="mb-3 border-s-4"
                                            style="border-left-color: #4DB6AC !important;">
                                            <v-card-text class="pa-3">

                                                <div class="d-flex flex-wrap align-center mb-2 pb-2 border-b">

                                                    <div class="d-flex align-center mr-4">
                                                        <v-icon size="small" color="primary"
                                                            class="mr-1">mdi-account</v-icon>
                                                        <span class="font-weight-bold text-subtitle-2 text-primary">
                                                            {{ guestData.latestName }}
                                                        </span>
                                                    </div>

                                                    <div class="d-flex align-center mr-4">
                                                        <v-icon size="small" color="grey"
                                                            class="mr-1">mdi-calendar-clock</v-icon>
                                                        <span
                                                            class="text-caption text-grey-darken-2 font-weight-medium">
                                                            {{ log.date }}
                                                        </span>
                                                    </div>

                                                    <div v-if="log.startTime && log.endTime" class="mr-2">
                                                        <span class="text-caption text-grey-darken-1 font-weight-bold"
                                                            style="font-family: monospace;">
                                                            {{ log.startTime }}~{{ log.endTime }}
                                                        </span>
                                                    </div>

                                                    <div v-if="calculateDuration(log.startTime, log.endTime)"
                                                        class="d-flex align-center mr-3">
                                                        <v-chip size="small" color="teal-lighten-5"
                                                            class="text-teal-darken-3 font-weight-bold px-2"
                                                            variant="flat" label>
                                                            <v-icon start size="small"
                                                                class="mr-1">mdi-timer-outline</v-icon>
                                                            {{ calculateDuration(log.startTime, log.endTime) }} 分鐘
                                                        </v-chip>
                                                    </div>


                                                    <v-chip
                                                        v-if="log.tags && log.tags['rating'] && log.tags['rating'].length"
                                                        size="small" variant="flat" label class="font-weight-bold"
                                                        :color="getRatingStyle(log.tags['rating']).color"
                                                        :class="getRatingStyle(log.tags['rating']).textClass">
                                                        <span class="mr-1" style="opacity: 0.8;">等級:</span>
                                                        <span>
                                                            {{ Array.isArray(log.tags['rating']) ?
                                                                log.tags['rating'].join(', ') :
                                                                log.tags['rating'] }}
                                                        </span>
                                                    </v-chip>

                                                    <v-spacer></v-spacer>

                                                    <!-- 參考建案：來源建案標籤 -->
                                                    <v-chip
                                                        v-if="log.sourceProjectId && log.sourceProjectId !== projectId"
                                                        size="small" color="indigo-lighten-4" variant="flat" label
                                                        class="mr-2" prepend-icon="mdi-arrow-top-right-thin">
                                                        <span class="text-indigo-darken-3 font-weight-medium">
                                                            來自 {{ log.sourceProjectName ||
                                                                projectStore.idToNameMap[log.sourceProjectId] ||
                                                                log.sourceProjectId }}
                                                        </span>
                                                    </v-chip>

                                                    <div class="d-flex flex-column align-end mr-2">
                                                        <span class="text-caption text-grey-darken-1">
                                                            記錄人: {{ log.recorderName }}
                                                        </span>
                                                        <span
                                                            class="text-caption text-indigo-darken-2 font-weight-bold">
                                                            銷售: {{ guestData.latestSalesName || '未指派' }}
                                                        </span>
                                                    </div>

                                                    <v-btn v-if="canEdit || log.recorderName === userStore.user?.name"
                                                        icon="mdi-pencil" variant="text" size="x-small"
                                                        color="grey-darken-1" @click="openEditLog(log)"
                                                        title="編輯此紀錄"></v-btn>

                                                </div>

                                                <div class="mb-2 d-flex flex-wrap gap-1">
                                                    <template v-for="(val, key) in log.tags" :key="key">
                                                        <v-chip v-if="key !== 'rating' && val && val.length"
                                                            size="small" color="blue-grey-lighten-4" variant="flat"
                                                            class="mr-1 mb-1" label>
                                                            <span class="text-grey-darken-2 mr-1">{{ getFieldLabel(key)
                                                            }}:</span>
                                                            <span class="font-weight-bold text-blue-grey-darken-3">
                                                                {{ Array.isArray(val) ? val.join(', ') : val }}
                                                            </span>
                                                        </v-chip>
                                                    </template>
                                                </div>

                                                <div class="text-body-2 text-grey-darken-3 pl-1"
                                                    style="white-space: pre-wrap; line-height: 1.6;">{{ log.content }}
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
        </v-card>

        <v-dialog v-model="isAddLogDialogVisible" max-width="600px" persistent
            :fullscreen="$vuetify.display.smAndDown" scrollable>
            <v-card>
                <v-card-title class="bg-teal text-white d-flex align-center">
                    <v-icon start>{{ editingLogId ? 'mdi-pencil' : 'mdi-pen-plus' }}</v-icon>
                    {{ editingLogId ? '編輯洽談紀錄' : '新增洽談紀錄' }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-row>
                        <v-col cols="12" sm="6">
                            <input type="date" v-model="newLogDate" :max="todayDate"
                                class="w-100 pa-3 rounded border" style="border-color: rgba(0,0,0,0.12); font-family: inherit;">
                        </v-col>
                    </v-row>

                    <v-row dense class="mt-2">
                        <v-col cols="6">
                            <input type="time" v-model="newLog.startTime"
                                class="w-100 pa-3 rounded border" style="border-color: rgba(0,0,0,0.12); font-family: inherit;">
                            <div v-if="newLog.startTime" class="text-caption text-grey mt-1">開始時間</div>
                        </v-col>
                        <v-col cols="6">
                            <input type="time" v-model="newLog.endTime"
                                class="w-100 pa-3 rounded border" style="border-color: rgba(0,0,0,0.12); font-family: inherit;">
                            <div v-if="newLog.endTime" class="text-caption text-grey mt-1">結束時間</div>
                            <div v-if="newLog.endTime && !isEndTimeValid(newLog.startTime, newLog.endTime)"
                                class="text-caption text-error mt-1">結束時間不可早於開始時間</div>
                        </v-col>
                    </v-row>

                    <div class="mt-4">
                        <v-row dense>
                            <template v-for="(fieldKey, idx) in logFields" :key="idx">

                                <v-col cols="12" v-if="fieldKey === 'keyTags' && fieldSettings[fieldKey]">
                                    <div class="d-flex align-center mb-1">
                                        <span class="text-caption text-grey-darken-1">{{ fieldSettings[fieldKey].label
                                        }}</span>
                                        <v-btn size="small" variant="text" color="primary" class="ml-2"
                                            prepend-icon="mdi-tag-plus-outline" @click="openTagDialog">
                                            加入標籤
                                        </v-btn>
                                    </div>
                                    <div class="d-flex flex-wrap gap-2 py-2 px-3 bg-grey-lighten-5 rounded border"
                                        style="min-height: 48px; align-items: center;">
                                        <span v-if="!newLog.tags[fieldKey] || newLog.tags[fieldKey].length === 0"
                                            class="text-caption text-grey">
                                            未選擇任何標籤...
                                        </span>

                                        <v-chip v-for="tag in newLog.tags[fieldKey]" :key="tag" size="small"
                                            color="blue-grey" variant="tonal" label closable
                                            @click:close="removeTag(tag)">
                                            {{ tag }}
                                        </v-chip>
                                    </div>
                                </v-col>

                                <v-col cols="12" sm="6"
                                    v-else-if="fieldSettings[fieldKey] && !(fieldKey === 'noPurchaseReason' && newLog.tags.interactionType === '已購回訪')">
                                    <v-select v-model="newLog.tags[fieldKey]" :label="fieldSettings[fieldKey].label"
                                        :items="getOptions(fieldKey)"
                                        :multiple="fieldSettings[fieldKey].selectionMode === 'multiple'"
                                        density="compact" variant="outlined"
                                        :rules="[v => (Array.isArray(v) ? v.length > 0 : !!v) || '必填']"
                                        hide-details="auto" class="mb-2"></v-select>
                                </v-col>
                            </template>
                        </v-row>
                    </div>

                    <v-textarea v-model="newLog.content" label="洽談內容 (必填)" variant="outlined" rows="5" class="mt-4"
                        placeholder="請輸入詳細洽談內容..." :rules="[v => !!v || '內容為必填']"></v-textarea>

                    <div class="d-flex justify-end mt-1">
                        <v-btn size="small" variant="text" color="deep-purple-accent-3" prepend-icon="mdi-magic-staff"
                            :loading="isOptimizing" :disabled="!newLog.content || isOptimizing"
                            @click="handleOptimizeText">
                            AI 優化文本 (Gemini)
                        </v-btn>
                    </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions class="pa-4">
                    <v-btn v-if="editingLogId" color="error" variant="text" prepend-icon="mdi-delete"
                        @click="handleDeleteLog" :loading="isDeletingLog">
                        刪除紀錄
                    </v-btn>

                    <v-spacer></v-spacer>

                    <v-btn color="grey-darken-1" variant="text" @click="closeLogDialog"
                        :disabled="isAddingLog || isDeletingLog">
                        取消
                    </v-btn>

                    <v-btn color="teal" variant="elevated" @click="handleSaveLog" :loading="isAddingLog"
                        :disabled="!isValidLog">
                        {{ editingLogId ? '更新紀錄' : '確認新增' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="isTagDialogVisible" max-width="500px">
            <v-card>
                <v-card-title class="bg-blue-grey-lighten-5 text-subtitle-1 font-weight-bold">
                    選擇重點標籤
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-chip-group v-model="tempTags" column multiple filter selected-class="text-primary">
                        <v-chip v-for="option in keyTagsOptions" :key="option" :value="option" variant="outlined"
                            filter>
                            {{ option }}
                        </v-chip>
                        <v-chip v-for="custom in tempCustomTags" :key="custom" :value="custom" variant="outlined"
                            filter>
                            {{ custom }} (自訂)
                        </v-chip>
                    </v-chip-group>

                    <div v-if="fieldSettings['keyTags']?.allowCustom" class="mt-4 pt-4 border-t">
                        <v-text-field v-model="customTagInput" label="新增自訂標籤" variant="outlined" density="compact"
                            hide-details placeholder="輸入後按 Enter" append-inner-icon="mdi-plus"
                            @click:append-inner="addCustomTag" @keydown.enter.prevent="addCustomTag"></v-text-field>
                    </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey-darken-1" variant="text" @click="isTagDialogVisible = false">取消</v-btn>
                    <v-btn color="primary" variant="elevated" @click="saveTags">確認</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="isAddPhoneDialogVisible" max-width="400px">
            <v-card>
                <v-card-title class="bg-blue-grey-lighten-5 text-subtitle-1 font-weight-bold">
                    新增其他聯絡電話
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-form ref="addPhoneForm">
                        <v-text-field label="姓名" v-model="newPhoneData.name" variant="outlined" density="compact"
                            :rules="[v => !!v || '必填']" class="mb-2"></v-text-field>
                        <v-text-field label="關係" v-model="newPhoneData.relation" variant="outlined" density="compact"
                            class="mb-2"></v-text-field>
                        <v-text-field label="電話" v-model="newPhoneData.phone" variant="outlined" density="compact"
                            :rules="[v => !!v || '必填']"></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey-darken-1" variant="text" @click="isAddPhoneDialogVisible = false">取消</v-btn>
                    <v-btn color="primary" variant="elevated" @click="handleAddNewPhone"
                        :loading="isSavingPhone">確認新增</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-overlay :model-value="isLoading" class="align-center justify-center" persistent>
            <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
        </v-overlay>
    </v-dialog>

    <!-- 🤖 AI 優化確認對話框 -->
    <v-dialog v-model="showOptimizeDialog" max-width="600" persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="deep-purple-accent-3" density="compact">
                <v-icon start class="ml-4">mdi-magic-staff</v-icon>
                <v-toolbar-title class="text-subtitle-1 font-weight-bold">AI 優化結果 (Gemini)</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" variant="text" @click="showOptimizeDialog = false"></v-btn>
            </v-toolbar>

            <v-card-text class="pt-4 bg-grey-lighten-5">
                <v-row>
                    <v-col cols="12">
                        <div class="text-caption text-grey-darken-1 mb-1 font-weight-bold">
                            <v-icon size="x-small" start>mdi-text-box-outline</v-icon>原始內容
                        </div>
                        <div class="pa-3 bg-white rounded border text-body-2 text-grey-darken-2"
                            style="white-space: pre-wrap; max-height: 150px; overflow-y: auto;">{{ newLog.content }}
                        </div>
                    </v-col>
                    <v-col cols="12" class="text-center">
                        <v-icon color="grey-lighten-1">mdi-arrow-down</v-icon>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-deep-purple-accent-3 mb-1 font-weight-bold">
                            <v-icon size="x-small" start>mdi-creation</v-icon>優化後內容
                        </div>
                        <v-textarea v-model="optimizedContent" variant="outlined" color="deep-purple-accent-3"
                            bg-color="white" rows="6" hide-details auto-grow class="font-weight-medium"></v-textarea>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="pa-4 bg-white">
                <v-btn variant="text" color="deep-purple-accent-3" prepend-icon="mdi-refresh" :loading="isOptimizing"
                    @click="handleOptimizeText">
                    重新優化
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="showOptimizeDialog = false">取消</v-btn>
                <v-btn color="deep-purple-accent-3" variant="elevated" prepend-icon="mdi-check"
                    @click="applyOptimizedText">替換並使用</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <!-- 選擇目標銷售對話框 -->
    <v-dialog v-model="targetSalesDialog.show" max-width="400" persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="error" density="compact">
                <v-icon start class="ml-4">mdi-account-cancel</v-icon>
                <v-toolbar-title class="text-subtitle-1 font-weight-bold">請選擇操作對象</v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pt-4 bg-grey-lighten-5">
                <div class="mb-4 text-body-1">
                    這筆客戶資料歷來有多位負責銷售。<br />請選擇您確定要針對哪幾位名單執行「<span class="font-weight-bold text-error">{{
                        targetSalesDialog.actionDesc }}</span>」：
                </div>
                <v-select v-model="targetSalesDialog.selected" :items="targetSalesDialog.options" label="選擇銷售人員 (可多選)"
                    variant="outlined" color="error" multiple chips closable-chips hide-details></v-select>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="pa-4 bg-white">
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="cancelSalesSelection">取消</v-btn>
                <v-btn color="error" variant="elevated" @click="confirmSalesSelection"
                    :disabled="targetSalesDialog.selected.length === 0">確定</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // 新增這一行
import {
    fetchCustomerInteractionDetails,
    addInteractionLog,
    updateCustomerProfile,
    updateInteractionLog,
    deleteInteractionLog,
    optimizeInteractionLog,
    softDeleteCustomer,
    restoreCustomer,
    updateLinkedProjects,
    unlinkProject,
    getUsersWithSystemPermission
} from '@/api';
import { useToast } from 'vue-toastification';
import TwCities from '@/assets/TwCities.json';

/**
 * 格式化銷售人員名稱
 */
const formatSalesNames = (names) => {
    if (!names) return '';
    if (typeof names === 'string') {
        return names;
    }
    if (Array.isArray(names)) {
        return names.join('、');
    }
    return '';
};

/**
 * 格式化完整的日期時間 (用於洽談紀錄更新時間)
 * 格式：2025-12-24 下午 06:13:59
 */
const formatFullDateTime = (t) => {
    const date = parseTimestamp(t);
    if (!date) return '-';

    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).replace(/\//g, '-'); // 將斜線改為橫線更符合系統一致性
};

const props = defineProps({
    show: Boolean,
    projectId: String,
    projectName: String, // 新增這這一行，接收父層傳來的名稱
    docId: String,
    salesName: { type: [String, Array], default: '' },
    settings: { type: Object, default: () => ({}) },
    isDeleted: { type: Boolean, default: false }
});

const emit = defineEmits(['update:show', 'data-updated']);
const userStore = useUserStore();
const projectStore = useProjectStore(); // 新增這一行
const toast = useToast();

// State
const isLoading = ref(false);
const isAddingLog = ref(false);
const isSavingProfile = ref(false);
const isEditingProfile = ref(false);
const canEdit = ref(false);

// Dialog 開關
const isAddLogDialogVisible = ref(false);
const isTagDialogVisible = ref(false);
const isAddPhoneDialogVisible = ref(false);
const isSavingPhone = ref(false);

// 控制詳細需求面板的開合 (null 代表預設閉合)
const detailsPanel = ref(null);

const isDeletingLog = ref(false); // 控制刪除按鈕的 Loading 狀態

// 計算持續時間 (分鐘)
const calculateDuration = (start, end) => {
    if (!start || !end) return null;

    try {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        const diff = endTotal - startTotal;

        return diff > 0 ? diff : null;
    } catch (e) {
        return null;
    }
};

const editingLogId = ref(null);

const guestData = ref({
    latestName: '',
    phone: '',
    otherPhones: [],
    interactionLogs: [],
    profile: {},
    submissions: [],
    isDeleted: props.isDeleted
});

const editingData = ref({});

// 新增/編輯紀錄表單
const newLog = ref({
    date: new Date(),
    content: '',
    tags: {}
});

// 日期的YYYY-MM-DD格式（給input type="date"使用）
const newLogDate = computed({
    get: () => {
        const date = newLog.value.date;
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    set: (val) => {
        if (val) {
            newLog.value.date = new Date(val);
        }
    }
});

// 今天的YYYY-MM-DD格式（給input type="date"的max屬性使用）
const todayDate = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});

const tempTags = ref([]);
const customTagInput = ref('');

const addPhoneForm = ref(null);
const newPhoneData = ref({ name: '', relation: '', phone: '' });

// 🤖 AI 優化相關
const isOptimizing = ref(false);
const showOptimizeDialog = ref(false);
const optimizedContent = ref('');

const handleOptimizeText = async () => {
    if (!newLog.value.content) return;
    isOptimizing.value = true;
    try {
        const result = await optimizeInteractionLog({ text: newLog.value.content });
        // result.data 包含回傳的 { status, optimizedText }
        if (result.data && result.data.status === 'success') {
            optimizedContent.value = result.data.optimizedText;
            showOptimizeDialog.value = true;
        } else {
            toast.error('優化失敗，請稍後再試');
        }
    } catch (e) {
        console.error('AI Optimize Error:', e);
        if (e.message && e.message.includes('系統未設定 AI 金鑰')) {
            toast.error('尚未設定 API Key，請聯繫管理員');
        } else {
            toast.error(e.message || 'AI 服務暫時無法使用');
        }
    } finally {
        isOptimizing.value = false;
    }
};

const applyOptimizedText = () => {
    newLog.value.content = optimizedContent.value;
    showOptimizeDialog.value = false;
    toast.success('文本已優化✨');
};

const logFields = ['visitors', 'interactionType', 'noPurchaseReason', 'keyTags', 'rating'];
const fieldSettings = computed(() => props.settings.fields || {});

// 互動方式為「已購回訪」時，自動鎖定未買原因為「已購回訪」並隱藏欄位
watch(() => newLog.value.tags?.interactionType, (newVal, oldVal) => {
    if (newVal === '已購回訪') {
        newLog.value.tags.noPurchaseReason = ['已購回訪'];
    } else if (oldVal === '已購回訪') {
        newLog.value.tags.noPurchaseReason = [];
    }
});

// --- 職業欄位「其他」邏輯 ---
const occupationSelection = ref(null);
const customOccupation = ref('');
const occupationOptionsWithOther = computed(() => {
    const opts = fieldSettings.value['occupation']?.options || [];
    return [...opts, '其他'];
});

// 修改 isValidLog 計算屬性，加入時間驗證
const isValidLog = computed(() => {
    if (!newLog.value.content) return false;

    // ✅ 新增：檢查結束時間是否合法
    if (!isEndTimeValid(newLog.value.startTime, newLog.value.endTime)) {
        return false;
    }

    const requiredFields = logFields.filter(k => k !== 'keyTags');
    for (const key of requiredFields) {
        if (fieldSettings.value[key]) {
            const val = newLog.value.tags[key];
            if (!val || (Array.isArray(val) && val.length === 0)) {
                return false;
            }
        }
    }
    return true;
});


// 通用輔助函式：從 Profile 欄位取得單一顯示值
const getProfileDisplayValue = (key) => {
    const val = guestData.value.profile?.[key];
    if (Array.isArray(val)) {
        return val.length > 0 ? val[val.length - 1] : '';
    }
    return val || '';
};

// 1. 取得所有縣市名稱
const cityOptions = computed(() => {
    return TwCities.map(c => c.name);
});

// 2. 根據目前選擇的城市，取得對應的鄉鎮市區
const districtOptions = computed(() => {
    const currentCity = editingData.value.profile?.['居住城市'];
    if (!currentCity) return [];

    const cityData = TwCities.find(c => c.name === currentCity);

    return cityData ? cityData.districts.map(d => d.name) : [];
});


// 3. 監聽城市改變，自動清空鄉鎮市區 
watch(() => editingData.value.profile?.['居住城市'], (newVal, oldVal) => {
    if (isEditingProfile.value && newVal !== oldVal && oldVal !== undefined) {
        if (editingData.value.profile) {
            editingData.value.profile['居住鄉鎮市區'] = null;
        }
    }
});

// 取得最新完整地址
const latestFullAddress = computed(() => {
    const subs = guestData.value.submissions || [];
    if (subs.length > 0) {
        const latest = subs[subs.length - 1];
        const city = latest['居住城市'] || '';
        const district = latest['居住鄉鎮市區'] || '';
        const address = latest['居住詳細地址'] || '';

        if (city || district || address) {
            return `${city}${district}${address}`;
        }
    }

    const p = guestData.value.profile || {};
    const getVal = (key) => {
        const val = p[key];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    const city = getVal('居住城市');
    const district = getVal('居住鄉鎮市區');
    const address = getVal('居住詳細地址');

    return `${city}${district}${address}` || '未填寫';
});

// 取得歷史地址列表 
const addressHistory = computed(() => {
    const subs = guestData.value.submissions || [];
    if (subs.length <= 1) return [];

    return [...subs].reverse().map(sub => {
        const city = sub['居住城市'] || '';
        const district = sub['居住鄉鎮市區'] || '';
        const address = sub['居住詳細地址'] || '';
        const full = `${city}${district}${address}`;
        return {
            date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '未知日期',
            fullAddress: full
        };
    }).filter(item => item.fullAddress);
});


// 1. 萬用時間解析函式 
const parseTimestamp = (t) => {
    if (!t) return null;
    if (typeof t.toDate === 'function') return t.toDate();
    if (t._seconds !== undefined) return new Date(t._seconds * 1000);
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
};

// 2. 排序 Submissions 的輔助函式
const getSortedSubmissions = () => {
    const subs = guestData.value.submissions || [];
    if (subs.length === 0) return [];
    return [...subs].sort((a, b) => {
        const timeA = parseTimestamp(a.submittedAt)?.getTime() || 0;
        const timeB = parseTimestamp(b.submittedAt)?.getTime() || 0;
        return timeA - timeB;
    });
};

// 計算地址變更歷史 
const addressList = computed(() => {
    const history = [];
    const p = guestData.value.profile || {};

    const getProfileVal = (k) => {
        const val = p[k];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    const currentCity = getProfileVal('居住城市');
    const currentDist = getProfileVal('居住鄉鎮市區');
    const currentAddr = getProfileVal('居住詳細地址');
    const currentFull = `${currentCity}${currentDist}${currentAddr}`;

    if (currentFull) {
        history.push({
            date: '目前',
            fullAddress: currentFull
        });
    }

    const sortedSubs = getSortedSubmissions();
    const reverseSubs = [...sortedSubs].reverse();

    reverseSubs.forEach(sub => {
        const c = sub['居住城市'] || '';
        const d = sub['居住鄉鎮市區'] || '';
        const a = sub['居住詳細地址'] || '';
        const subFull = `${c}${d}${a}`;

        const lastHistoryVal = history.length > 0 ? history[history.length - 1].fullAddress : '';

        if (subFull && subFull !== lastHistoryVal) {
            let dateStr = '未知日期';
            const dateObj = parseTimestamp(sub.submittedAt);
            if (dateObj) dateStr = dateObj.toLocaleDateString('zh-TW');

            history.push({ date: dateStr, fullAddress: subFull });
        }
    });

    return history;
});

// 通用單一欄位歷史產生器 
const getSimpleFieldHistory = (fieldName) => {
    const sortedSubs = getSortedSubmissions();

    if (sortedSubs.length === 0) {
        const p = guestData.value.profile || {};
        const valArr = p[fieldName];
        const val = Array.isArray(valArr) ? (valArr.length > 0 ? valArr[valArr.length - 1] : '') : (valArr || '');
        return val ? [{ value: val, date: '目前' }] : [];
    }

    const history = [];
    let lastVal = '';

    sortedSubs.forEach(sub => {
        const val = sub[fieldName] || '';
        if (val && val !== lastVal) {
            let dateStr = '未知日期';
            const dateObj = parseTimestamp(sub.submittedAt);
            if (dateObj) dateStr = dateObj.toLocaleDateString('zh-TW');

            history.push({ date: dateStr, value: val });
            lastVal = val;
        }
    });
    return history.reverse();
};

// 合併「職業/任職公司」的歷史紀錄 
const careerList = computed(() => {
    const history = [];
    const p = guestData.value.profile || {};

    const getProfileVal = (k) => {
        const val = p[k];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    const currentProf = getProfileVal('職業') || '-';
    const currentComp = getProfileVal('任職公司') || '-';
    const currentFull = `${currentProf} / ${currentComp}`;

    if (currentProf !== '-' || currentComp !== '-') {
        history.push({
            date: '目前',
            full: currentFull
        });
    }

    const sortedSubs = getSortedSubmissions();
    const reverseSubs = [...sortedSubs].reverse();

    reverseSubs.forEach(sub => {
        const prof = sub['職業'] || '-';
        const comp = sub['任職公司'] || '-';
        const subFull = `${prof} / ${comp}`;

        const lastHistoryVal = history.length > 0 ? history[history.length - 1].full : '';

        if ((prof !== '-' || comp !== '-') && subFull !== lastHistoryVal) {
            let dateStr = '未知日期';
            const dateObj = parseTimestamp(sub.submittedAt);
            if (dateObj) dateStr = dateObj.toLocaleDateString('zh-TW');

            history.push({
                date: dateStr,
                full: subFull
            });
        }
    });

    return history;
});


// --- Methods ---

// --- 客戶冷刪除/復原 邏輯 ---
const isDeletingCustomer = ref(false);
const isRestoringCustomer = ref(false);

// 目標銷售選擇對話框狀態
const targetSalesDialog = ref({
    show: false,
    resolve: null,
    options: [],
    selected: [],
    actionDesc: ''
});

const promptSalesSelectionDialog = (options, defaultVal, actionDesc) => {
    return new Promise((resolve) => {
        targetSalesDialog.value = {
            show: true,
            resolve: resolve,
            options: options,
            selected: defaultVal ? [defaultVal] : (options.length > 0 ? [options[0]] : []),
            actionDesc: actionDesc
        };
    });
};

const confirmSalesSelection = () => {
    if (targetSalesDialog.value.resolve) {
        targetSalesDialog.value.resolve(targetSalesDialog.value.selected);
    }
    targetSalesDialog.value.show = false;
};

const cancelSalesSelection = () => {
    if (targetSalesDialog.value.resolve) {
        targetSalesDialog.value.resolve(null);
    }
    targetSalesDialog.value.show = false;
};

// ===== 取得目標銷售人員名稱輔助函式 =====
const getTargetSalesNameOptionallyAsync = async (actionDesc = '操作') => {
    // 1. 取得該客戶負責的銷售人員陣列
    let assignedSales = [];
    if (Array.isArray(guestData.value.profile?.['銷售人員'])) {
        assignedSales = guestData.value.profile['銷售人員'].filter(Boolean);
    } else if (guestData.value.profile?.['銷售人員']) {
        assignedSales = [String(guestData.value.profile['銷售人員'])];
    }

    // 2. 確定最新負責人 (Primary Owner)
    const latestSales = guestData.value.latestSalesName;

    if (assignedSales.length <= 1) {
        const candidate = latestSales || assignedSales[0] || userStore.user?.name;
        return candidate ? [candidate] : [];
    }

    // 3. 多位銷售的情況
    // 優先認定最新銷售人員為當前負責人
    const defaultSales = latestSales || assignedSales[assignedSales.length - 1];

    // 使用非同步選單對話框讓使用者可以「多選」
    const chosenArray = await promptSalesSelectionDialog(assignedSales, defaultSales, actionDesc);
    return chosenArray || [];
};

const handleDeleteCustomer = async () => {
    const targetSalesNames = await getTargetSalesNameOptionallyAsync('隱藏(冷刪除)');

    if (!targetSalesNames || targetSalesNames.length === 0) {
        return;
    }

    if (!confirm(`確定要將此客戶從【${targetSalesNames.join('、')}】的名單中隱藏(冷刪除)嗎？（刪除後須開啟「顯示已刪除」才能復原）`)) return;

    isDeletingCustomer.value = true;
    try {
        const operatorPhone = userStore.user?.key;

        // 批次執行隱藏名單
        await Promise.all(targetSalesNames.map(name =>
            softDeleteCustomer(props.projectId, props.docId, name, operatorPhone)
        ));

        toast.success(`客戶資料已從【${targetSalesNames.join('、')}】的名單中移除`);
        guestData.value.isDeleted = true;
        // 同步更新本地 state
        if (!guestData.value.deletedSales) guestData.value.deletedSales = [];

        targetSalesNames.forEach(name => {
            if (!guestData.value.deletedSales.includes(name)) {
                guestData.value.deletedSales.push(name);
            }
        });

        emit('data-updated');
    } catch (error) {
        toast.error(`刪除失敗: ${error.message}`);
    } finally {
        isDeletingCustomer.value = false;
    }
};

const handleRestoreCustomer = async () => {
    const targetSalesNames = await getTargetSalesNameOptionallyAsync('復原');
    if (!targetSalesNames || targetSalesNames.length === 0) return;

    isRestoringCustomer.value = true;
    try {
        // 批次執行復原名單
        await Promise.all(targetSalesNames.map(name =>
            restoreCustomer(props.projectId, props.docId, name)
        ));

        toast.success(`客戶資料已復原並顯示於【${targetSalesNames.join('、')}】的名單中`);
        guestData.value.isDeleted = false;
        // 同步更新本地 state
        if (guestData.value.deletedSales) {
            guestData.value.deletedSales = guestData.value.deletedSales.filter(name => !targetSalesNames.includes(name));
        }
        emit('data-updated');
    } catch (error) {
        toast.error(`復原失敗: ${error.message}`);
    } finally {
        isRestoringCustomer.value = false;
    }
};

// --- 參考建案 邏輯 ---
const isEditingLinkedProjects = ref(false);
const editingLinkedProjectIds = ref([]);
const isSavingLinkedProjects = ref(false);
const isUnlinking = ref(false);

// 判斷目前是否為關聯建案模式（從非主歸屬建案進入）
const isLinkedMode = computed(() => {
    return guestData.value.projectId && guestData.value.projectId !== props.projectId;
});

// 主歸屬建案名稱
const mainProjectName = computed(() => {
    const pid = guestData.value.projectId || props.projectId;
    return projectStore.idToNameMap[pid] || pid;
});

// 來源建案名稱（關聯模式下使用）
const sourceProjectName = computed(() => {
    if (!isLinkedMode.value) return '';
    return projectStore.idToNameMap[guestData.value.projectId] || guestData.value.projectId;
});

// 取得主項目 ID
const mainProjectId = computed(() => {
    return guestData.value.projectId || props.projectId;
});

// 調試用：顯示權限檢查的詳細信息
const permissionDebugInfo = computed(() => {
    const permissions = userStore.user?.permissions || {};
    const mainPid = mainProjectId.value;
    const permission = permissions[mainPid];

    return {
        mainPid,
        hasPermission: permission ? true : false,
        systems: permission?.systems || [],
        hasCabinetSystem: permission?.systems?.includes('客資系統-櫃台') || false
    };
});

// 檢查使用者是否有"客資系統-櫃台"權限
const hasCounterPermission = computed(() => {
    return permissionDebugInfo.value.hasCabinetSystem;
});

// 銷售人員列表（該建案中有相應權限的用戶，排除管理員）
const salesPersonList = ref([]);

// 取得使用者可勾選的建案列表（排除主歸屬建案）
const availableLinkedProjects = computed(() => {
    const permissions = userStore.user?.permissions || {};
    const targetSystems = ['客資系統-銷售', '客資系統-櫃台'];
    const mainPid = mainProjectId.value;

    return Object.entries(permissions)
        .filter(([projectId, perm]) => {
            // 排除主歸屬建案
            if (projectId === mainPid) return false;
            // 檢查是否有客資相關權限
            return perm.systems?.some(sys => targetSystems.includes(sys));
        })
        .map(([projectId, perm]) => ({
            id: projectId,
            name: projectStore.idToNameMap[projectId] || perm.projectName || projectId
        }));
});

// --- 主歸屬建案變更 ---
const isEditingMainProject = ref(false);
const editingMainProjectId = ref('');
const isSavingMainProject = ref(false);
const confirmMainProjectDialog = ref(false);

// 可選為主歸屬的建案（所有具備 客資系統-銷售/櫃台 權限的建案）
const availableMainProjects = computed(() => {
    const permissions = userStore.user?.permissions || {};
    const targetSystems = ['客資系統-銷售', '客資系統-櫃台'];
    return Object.entries(permissions)
        .filter(([_, perm]) => perm.systems?.some(sys => targetSystems.includes(sys)))
        .map(([projectId, perm]) => ({
            id: projectId,
            name: projectStore.idToNameMap[projectId] || perm.projectName || projectId
        }));
});

const editingMainProjectName = computed(() => {
    const proj = availableMainProjects.value.find(p => p.id === editingMainProjectId.value);
    return proj ? proj.name : editingMainProjectId.value;
});

const startEditMainProject = () => {
    editingMainProjectId.value = mainProjectId.value;
    isEditingMainProject.value = true;
};

const cancelEditMainProject = () => {
    isEditingMainProject.value = false;
    editingMainProjectId.value = '';
};

const confirmChangeMainProject = () => {
    if (!editingMainProjectId.value || editingMainProjectId.value === mainProjectId.value) return;
    confirmMainProjectDialog.value = true;
};

const saveMainProjectChange = async () => {
    const oldMainId = mainProjectId.value;
    const newMainId = editingMainProjectId.value;
    if (!newMainId || newMainId === oldMainId) return;

    isSavingMainProject.value = true;
    try {
        const currentLinked = guestData.value.linkedProjectIds || [];
        // 交由後端做正規化（會自動排除新主、併入舊主）
        const result = await updateLinkedProjects(
            oldMainId,
            props.docId,
            currentLinked,
            userStore.user.key,
            newMainId
        );

        // 同步本地 state
        guestData.value.projectId = result.projectId || newMainId;
        guestData.value.linkedProjectIds = result.linkedProjectIds || currentLinked;
        guestData.value.allProjectIds = result.allProjectIds || [newMainId, ...currentLinked];

        if (result.mergedDocs && result.mergedDocs.length > 0) {
            toast.success(`主歸屬建案已變更，並合併了 ${result.mergedDocs.length} 筆重複資料`);
            await loadData();
        } else {
            toast.success('主歸屬建案已變更');
        }

        confirmMainProjectDialog.value = false;
        isEditingMainProject.value = false;
        editingMainProjectId.value = '';
        emit('data-updated');
    } catch (error) {
        toast.error(`變更失敗: ${error.message}`);
    } finally {
        isSavingMainProject.value = false;
    }
};

const startEditLinkedProjects = () => {
    editingLinkedProjectIds.value = [...(guestData.value.linkedProjectIds || [])];
    isEditingLinkedProjects.value = true;
};

const cancelEditLinkedProjects = () => {
    isEditingLinkedProjects.value = false;
    editingLinkedProjectIds.value = [];
};

const saveLinkedProjects = async () => {
    isSavingLinkedProjects.value = true;
    try {
        const mainPid = guestData.value.projectId || props.projectId;
        const result = await updateLinkedProjects(
            mainPid,
            props.docId,
            editingLinkedProjectIds.value,
            userStore.user.key
        );

        // 同步更新本地 state
        guestData.value.linkedProjectIds = result.linkedProjectIds || editingLinkedProjectIds.value;
        guestData.value.allProjectIds = result.allProjectIds || [mainPid, ...editingLinkedProjectIds.value];

        // 合併結果提示
        if (result.mergedDocs && result.mergedDocs.length > 0) {
            const mergeInfo = result.mergedDocs.map(m =>
                `${m.name} (${projectStore.idToNameMap[m.projectId] || m.projectId}): 合併 ${m.mergedSubs} 筆提交 + ${m.mergedLogs} 筆紀錄`
            ).join('\n');
            toast.success(`關聯建案已更新，並自動合併了 ${result.mergedDocs.length} 筆重複資料`);
            console.log('[參考建案] 合併結果:', mergeInfo);
            // 合併後重新載入完整資料
            await loadData();
        } else {
            toast.success('關聯建案已更新');
        }

        isEditingLinkedProjects.value = false;
        emit('data-updated');
    } catch (error) {
        toast.error(`更新失敗: ${error.message}`);
    } finally {
        isSavingLinkedProjects.value = false;
    }
};

const handleUnlinkProject = async () => {
    if (!confirm(`確定要取消此客戶與【${projectStore.idToNameMap[props.projectId] || props.projectId}】的關聯嗎？`)) return;

    isUnlinking.value = true;
    try {
        await unlinkProject(props.docId, props.projectId, userStore.user.key);
        toast.success('已取消關聯');
        emit('update:show', false);
        emit('data-updated');
    } catch (error) {
        toast.error(`取消關聯失敗: ${error.message}`);
    } finally {
        isUnlinking.value = false;
    }
};
const loadData = async () => {
    if (!props.docId) {
        return;
    }

    isLoading.value = true;

    try {
        const result = await fetchCustomerInteractionDetails(
            props.projectId,
            props.docId,
            userStore.user.key
        );

        if (result.status === 'success') {
            guestData.value = result.data.guestData;
            canEdit.value = result.data.canEdit;

            // 判斷該指定的銷售人員，是否已將該客資刪除 (解決不同業務間的冷刪除狀態衝突)
            const deletedSales = guestData.value.deletedSales || [];
            const currentUser = userStore.user?.name;
            let perspectiveSales = [];

            // 決定「當前視角的銷售人員」
            if (Array.isArray(props.salesName) && props.salesName.length === 1) {
                perspectiveSales = [props.salesName[0]];
            } else if (typeof props.salesName === 'string' && props.salesName) {
                perspectiveSales = [props.salesName];
            } else if (Array.isArray(props.salesName) && props.salesName.length > 1) {
                // 如果名單有多位
                if (props.salesName.includes(currentUser)) {
                    // 如果登入者是其中之一，自然以該登入者的視角為主
                    perspectiveSales = [currentUser];
                } else {
                    // 如果登入者不在其中 (如管理員看全部)，則涵蓋全部
                    perspectiveSales = props.salesName;
                }
            }

            if (perspectiveSales.length > 0) {
                // 若這個客資對視角內「所有人」都已被隱藏/刪除，才視為已刪除狀態（顯示復原按鈕）
                // 若還有人是存活的，就必須顯示刪除按鈕，以便能去刪除那個人
                guestData.value.isDeleted = perspectiveSales.every(name => deletedSales.includes(name));
            } else {
                // 防呆，沒名單時依賴整體
                guestData.value.isDeleted = deletedSales.length > 0;
            }

            if (!guestData.value.otherPhones) guestData.value.otherPhones = [];
            if (!guestData.value.interactionLogs) guestData.value.interactionLogs = [];

            guestData.value.interactionLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
    } catch (error) {
        console.error('載入失敗:', error);
        toast.error(`載入失敗: ${error.message}`);
        emit('update:show', false);
    } finally {
        isLoading.value = false;
    }
};

const getOptions = (key) => {
    const field = fieldSettings.value[key];
    if (!field) return [];
    return field.options || [];
};

const getFieldLabel = (key) => {
    return fieldSettings.value[key]?.label || key;
};

// 獲取銷售人員選項（用於選擇目前負責人員）
const getSalesPersonChipOptions = () => {
    if (!editingData.value.selectedSalesPersons || editingData.value.selectedSalesPersons.length === 0) {
        return [];
    }

    return editingData.value.selectedSalesPersons.map(phone => {
        const person = salesPersonList.value.find(p => p.phone === phone);
        return {
            phone: phone,
            label: person ? person.name : phone
        };
    });
};

const startEditProfile = () => {
    const rawData = JSON.parse(JSON.stringify(guestData.value));

    editingData.value = {
        latestName: rawData.latestName,
        otherPhones: rawData.otherPhones || [],
        profile: rawData.profile || {},
        selectedSalesPersons: [],
        latestSalesPhone: rawData.latestSalesPhone || ''
    };

    // 將銷售人員名稱轉換為電話號碼陣列（用於在選單中預設已選中的人員）
    // 優先從 profile.銷售人員 讀取，若無則用 props.salesName
    let salesNameArray = [];

    if (guestData.value.profile?.['銷售人員'] && Array.isArray(guestData.value.profile['銷售人員'])) {
        salesNameArray = guestData.value.profile['銷售人員'].filter(Boolean);
    } else if (props.salesName) {
        salesNameArray = typeof props.salesName === 'string'
            ? props.salesName.split('、').map(name => name.trim())
            : Array.isArray(props.salesName) ? props.salesName : [];
    }

    // 根據銷售人員名稱查找對應的電話號碼
    if (salesNameArray.length > 0 && salesPersonList.value.length > 0) {
        const selectedPhones = salesNameArray
            .map(name => {
                const person = salesPersonList.value.find(p => p.name === name);
                return person ? person.phone : null;
            })
            .filter(phone => phone !== null);

        editingData.value.selectedSalesPersons = selectedPhones;
    }

    const getSingleValue = (key) => {
        const val = editingData.value.profile[key];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    const fieldsToFlatten = ['職業', '任職公司', '居住城市', '居住鄉鎮市區', '居住詳細地址', '性別', '年齡'];

    fieldsToFlatten.forEach(key => {
        editingData.value.profile[key] = getSingleValue(key);
    });

    // 初始化 VIP 詳細需求欄位（根據 selectionMode 決定保留陣列或取單值）
    const vipFields = props.settings.vipFormFields || {};
    Object.entries(vipFields).forEach(([key, config]) => {
        const label = config.label;
        const val = editingData.value.profile[label];
        if (config.selectionMode === 'multiple') {
            // 複選：保持陣列格式
            editingData.value.profile[label] = Array.isArray(val) ? [...val] : (val ? [val] : []);
        } else {
            // 單選：取最新的單一值
            editingData.value.profile[label] = Array.isArray(val)
                ? (val.length > 0 ? val[val.length - 1] : null)
                : (val || null);
        }
    });

    // 初始化職業選擇狀態：若現有值不在選項中，視為「其他」
    const currentOccupation = editingData.value.profile['職業'] || '';
    const occupationOpts = fieldSettings.value['occupation']?.options || [];
    if (currentOccupation && !occupationOpts.includes(currentOccupation)) {
        occupationSelection.value = '其他';
        customOccupation.value = currentOccupation;
    } else {
        occupationSelection.value = currentOccupation || null;
        customOccupation.value = '';
    }

    isEditingProfile.value = true;
};

const cancelEditProfile = () => {
    isEditingProfile.value = false;
    editingData.value = {};
};

const saveProfile = async () => {
    if (!editingData.value.latestName) {
        toast.error('姓名為必填');
        return;
    }
    isSavingProfile.value = true;

    try {
        // 儲存前：將職業選擇結果寫回 profile
        if (occupationSelection.value === '其他') {
            editingData.value.profile['職業'] = customOccupation.value || '';
        } else {
            editingData.value.profile['職業'] = occupationSelection.value || '';
        }

        const targetProfileFields = [
            '性別',
            '年齡',
            '職業', '任職公司',
            '居住城市', '居住鄉鎮市區', '居住詳細地址'
        ];

        // 動態加入 VIP 詳細需求欄位的 label
        const vipFields = props.settings.vipFormFields || {};
        Object.values(vipFields).forEach(config => {
            if (config.label) targetProfileFields.push(config.label);
        });

        const profileUpdates = {};
        targetProfileFields.forEach(key => {
            profileUpdates[`profile.${key}`] = editingData.value.profile[key] || '';
        });

        // 將選定的銷售人員電話號碼轉換回名稱和電話陣列
        let salesNames = [];
        let salesPhones = [];

        if (editingData.value.selectedSalesPersons && editingData.value.selectedSalesPersons.length > 0) {
            editingData.value.selectedSalesPersons.forEach(phone => {
                const person = salesPersonList.value.find(p => p.phone === phone);
                if (person) {
                    salesNames.push(person.name);
                    salesPhones.push(person.phone);
                }
            });
        }

        // 最新的銷售人員由用戶選擇，若未選擇則使用列表中的最後一個
        let latestSalesName = '';
        let latestSalesPhone = editingData.value.latestSalesPhone || '';

        if (latestSalesPhone) {
            // 根據用戶選擇的 latestSalesPhone 取得對應的名稱
            const person = salesPersonList.value.find(p => p.phone === latestSalesPhone);
            if (person) {
                latestSalesName = person.name;
            }
        } else if (salesNames.length > 0) {
            // 若未選擇，則使用列表中的最後一個
            latestSalesName = salesNames[salesNames.length - 1];
            latestSalesPhone = salesPhones[salesPhones.length - 1];
        }

        const apiPayload = {
            latestName: editingData.value.latestName,
            otherPhones: editingData.value.otherPhones,
            latestSalesName: latestSalesName,
            latestSalesPhone: latestSalesPhone,
            'profile.銷售人員': salesNames,
            'profile.銷售人員電話': salesPhones,
            ...profileUpdates
        };

        await updateCustomerProfile(
            props.projectId,
            props.docId,
            apiPayload,
            userStore.user.key
        );

        guestData.value.latestName = editingData.value.latestName;
        guestData.value.otherPhones = editingData.value.otherPhones;

        // 更新銷售人員相關字段
        guestData.value.latestSalesName = latestSalesName;
        guestData.value.latestSalesPhone = latestSalesPhone;

        if (!guestData.value.profile) guestData.value.profile = {};

        targetProfileFields.forEach(key => {
            guestData.value.profile[key] = editingData.value.profile[key];
        });

        // 更新 profile 中的銷售人員數組
        guestData.value.profile['銷售人員'] = salesNames;
        guestData.value.profile['銷售人員電話'] = salesPhones;

        toast.success('基本資料已更新');
        isEditingProfile.value = false;
        emit('data-updated');
    } catch (error) {
        console.error(error);
        toast.error(`更新失敗: ${error.message}`);
    } finally {
        isSavingProfile.value = false;
    }
};

const addPhoneField = () => {
    editingData.value.otherPhones.push({ name: '', relation: '', phone: '' });
};

const removePhoneField = (index) => {
    editingData.value.otherPhones.splice(index, 1);
};

// --- 獨立新增電話 ---
const openAddPhoneDialog = () => {
    newPhoneData.value = { name: '', relation: '', phone: '' };
    isAddPhoneDialogVisible.value = true;
};

const handleAddNewPhone = async () => {
    const { valid } = await addPhoneForm.value.validate();
    if (!valid) return;

    isSavingPhone.value = true;
    try {
        const currentPhones = guestData.value.otherPhones ? [...guestData.value.otherPhones] : [];
        currentPhones.push({ ...newPhoneData.value });

        const profilePayload = {
            latestName: guestData.value.latestName,
            otherPhones: currentPhones
        };

        await updateCustomerProfile(
            props.projectId,
            props.docId,
            profilePayload,
            userStore.user.key
        );

        guestData.value.otherPhones = currentPhones;
        toast.success('已新增聯絡電話');
        isAddPhoneDialogVisible.value = false;
        emit('data-updated');

    } catch (error) {
        console.error(error);
        toast.error(`新增失敗: ${error.message}`);
    } finally {
        isSavingPhone.value = false;
    }
};

// --- 洽談紀錄管理 (新增與編輯) ---

// 修改新增視窗開啟邏輯
const openAddLogDialog = () => {
    editingLogId.value = null;

    const nowTime = getNowTimeStr();
    newLog.value = {
        date: new Date(),
        startTime: addMinutesToTimeStr(nowTime, -120), // ✅ 預設現在時間 - 2小時
        endTime: nowTime,                              // ✅ 預設現在時間
        content: '',
        tags: {}
    };
    isAddLogDialogVisible.value = true;
};

// 編輯時讀取既有的時間資料
const openEditLog = (log) => {
    editingLogId.value = log.logId;
    newLog.value = {
        date: new Date(log.date),
        startTime: log.startTime || '',
        endTime: log.endTime || '',
        content: log.content,
        tags: JSON.parse(JSON.stringify(log.tags || {}))
    };
    isAddLogDialogVisible.value = true;
};

// 關閉時重置
const closeLogDialog = () => {
    isAddLogDialogVisible.value = false;
    editingLogId.value = null;
    newLog.value = { date: new Date(), startTime: '', endTime: '', content: '', tags: {} };
};

// 儲存時將時間欄位寫入 Payload
const handleSaveLog = async () => {
    if (!newLog.value.content) return;

    isAddingLog.value = true;
    try {
        const logPayload = {
            date: newLog.value.date ? new Date(newLog.value.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            startTime: newLog.value.startTime || '',
            endTime: newLog.value.endTime || '',
            content: newLog.value.content,
            tags: { ...newLog.value.tags }
        };

        const currentUserName = userStore.user?.name;
        const currentUserPhone = userStore.user?.key;

        if (editingLogId.value) {
            await updateInteractionLog(
                props.projectId,
                props.docId,
                editingLogId.value,
                logPayload,
                currentUserName,
                currentUserPhone
            );
            toast.success('紀錄已更新');
        } else {
            await addInteractionLog(
                props.projectId,
                props.docId,
                logPayload,
                currentUserName,
                currentUserPhone,
                props.projectId,
                projectStore.idToNameMap[props.projectId] || props.projectId
            );
            toast.success('紀錄已新增');
        }

        await loadData();
        closeLogDialog();
    } catch (error) {
        toast.error(`儲存失敗: ${error.message}`);
    } finally {
        isAddingLog.value = false;
    }
};

// 3. 新增刪除處理函式 (放在 handleSaveLog 附近)
const handleDeleteLog = async () => {
    if (!editingLogId.value) return;

    // 二次確認預防誤刪
    if (!confirm('確定要刪除這筆洽談紀錄嗎？此動作無法復原。')) return;

    isDeletingLog.value = true;
    try {
        await deleteInteractionLog(
            props.projectId,
            props.docId,
            editingLogId.value,
            userStore.user.key // 記錄執行人 ID
        );

        toast.success('紀錄已成功刪除');
        await loadData(); // 重新整理列表
        closeLogDialog(); // 關閉對話框
    } catch (error) {
        console.error('刪除失敗:', error);
        toast.error(`刪除失敗: ${error.message}`);
    } finally {
        isDeletingLog.value = false;
    }
};

const keyTagsOptions = computed(() => {
    return getOptions('keyTags');
});

const tempCustomTags = computed(() => {
    const defaultOpts = keyTagsOptions.value;
    return tempTags.value.filter(tag => !defaultOpts.includes(tag));
});

const displayedName = computed(() => {
    const current = guestData.value.latestName || '';
    const subs = guestData.value.submissions || [];

    if (subs.length === 0) return current;

    const pastNames = subs
        .map(s => s['姓名'])
        .filter(n => n && n !== current);

    const uniquePastNames = [...new Set(pastNames)];

    if (uniquePastNames.length > 0) {
        return `${current}(${uniquePastNames.join('、')})`;
    }

    return current;
});

// 銷售人員顯示用：將 profile.銷售人員 正規化為陣列
// （兼容舊資料：可能是陣列、單一字串，或以、,/;； 分隔的多人字串；
//  若不正規化，字串會被 v-for 逐字拆成單字 chip）
const salesPersonNames = computed(() => {
    const raw = guestData.value.profile?.['銷售人員'];
    if (Array.isArray(raw)) {
        return raw.filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) {
        return raw.split(/[、,/;；]/).map(n => n.trim()).filter(Boolean);
    }
    return [];
});

const openTagDialog = () => {
    tempTags.value = [...(newLog.value.tags.keyTags || [])];
    customTagInput.value = '';
    isTagDialogVisible.value = true;
};

const saveTags = () => {
    if (!newLog.value.tags) newLog.value.tags = {};
    newLog.value.tags.keyTags = [...tempTags.value];
    isTagDialogVisible.value = false;
};

const addCustomTag = () => {
    const val = customTagInput.value.trim();
    if (val && !tempTags.value.includes(val)) {
        tempTags.value.push(val);
    }
    customTagInput.value = '';
};

const removeTag = (tagToRemove) => {
    if (newLog.value.tags.keyTags) {
        newLog.value.tags.keyTags = newLog.value.tags.keyTags.filter(t => t !== tagToRemove);
    }
};

const sortedProfileFields = computed(() => {
    const fields = props.settings.vipFormFields || {};
    return Object.entries(fields)
        .map(([key, config]) => ({
            key,
            label: config.label,
            order: config.order || 99
        }))
        .sort((a, b) => a.order - b.order);
});

// VIP 欄位設定（用於編輯模式中取得各欄位的 options、selectionMode、allowCustom）
const vipFieldSettings = computed(() => props.settings.vipFormFields || {});

// --- 時間處理輔助函式 ---

/** 獲取現在時間 (HH:mm) */
const getNowTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

/** 增加分鐘數並回傳 HH:mm 格式 */
const addMinutesToTimeStr = (timeStr, mins) => {
    if (!timeStr) return '';
    try {
        const [h, m] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + mins);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (e) {
        return '';
    }
};

/** 檢查時間先後 (endTime >= startTime) */
const isEndTimeValid = (start, end) => {
    if (!start || !end) return true;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) >= (sh * 60 + sm);
};

function getRatingStyle(rating) {
    const val = Array.isArray(rating) ? rating[0] : rating;

    if (!val) return { color: 'grey-lighten-2', textClass: 'text-grey-darken-2' };

    if (val.includes('A')) return { color: 'red-lighten-4', textClass: 'text-red-darken-4' };
    if (val.includes('B')) return { color: 'orange-lighten-4', textClass: 'text-orange-darken-4' };
    if (val.includes('C')) return { color: 'green-lighten-4', textClass: 'text-green-darken-4' };
    if (val.includes('D')) return { color: 'grey-lighten-3', textClass: 'text-grey-darken-2' };

    return { color: 'blue-grey-lighten-4', textClass: 'text-blue-grey-darken-3' };
}

onMounted(async () => {
    if (props.show && props.docId) {
        loadData();
    }
    // 加載銷售人員列表：該建案中有相應權限的用戶
    try {
        const projectId = props.projectId;
        if (!projectId) return;

        // 從該系統的用戶列表中篩選 - 只取該建案的人員
        const allUsers = await getUsersWithSystemPermission('客資系統-銷售', projectId);
        const counterUsers = await getUsersWithSystemPermission('客資系統-櫃台', projectId);
        const combinedUsers = [...allUsers, ...counterUsers];

        // 去重並排除管理員
        const seenPhones = new Set();
        const filteredUsers = [];

        combinedUsers.forEach(user => {
            if (!seenPhones.has(user.phone)) {
                // 檢查該用戶的角色是否包含管理員
                const roles = user.roles || [];
                const isAdmin = roles.some(role => role === '系統管理員' || role === '超級管理員');

                if (!isAdmin) {
                    filteredUsers.push({
                        phone: user.phone,
                        name: user.name || user.phone
                    });
                    seenPhones.add(user.phone);
                }
            }
        });

        salesPersonList.value = filteredUsers;
    } catch (error) {
        console.error('載入銷售人員列表失敗:', error);
    }
});

watch(() => props.docId, (newId) => {
    if (newId && props.show) {
        loadData();
    }
});

watch(() => props.show, (newVal) => {
    if (newVal && props.docId) {
        loadData();
    }
});
</script>

<style scoped>
.info-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

/* 移除展開面板的預設最小高度與內邊距，使其更融入基本資料卡片 */
:deep(.details-accordion .v-expansion-panel-title) {
    min-height: 32px !important;
}

:deep(.details-accordion .v-expansion-panel-text__wrapper) {
    padding: 0 !important;
}

:deep(.details-accordion .v-expansion-panel--active > .v-expansion-panel-title) {
    min-height: 32px !important;
}
</style>