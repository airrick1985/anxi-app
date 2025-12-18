<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column bg-grey-lighten-5">
      <v-toolbar color="white" density="compact" elevation="1">
        <v-btn icon="mdi-close" @click="$emit('update:show', false)"></v-btn>
        <v-toolbar-title class="text-h6 font-weight-bold text-primary">
          客戶洽談紀錄 - {{ guestData.latestName }}
        </v-toolbar-title>
 
      </v-toolbar>

      <v-card-text class="pa-0 flex-grow-1" style="overflow-y: auto;">
        <v-container fluid class="fill-height align-start pa-4">
            <v-row class="fill-height">
                
                <v-col cols="12" md="4" class="fill-height">
                    <v-card class="mb-4 fill-height" elevation="1">
                        <v-card-title class="bg-blue-grey-lighten-5 text-subtitle-1 font-weight-bold d-flex align-center justify-space-between">
                            <div>
                                <v-icon start color="blue-grey">mdi-account-details</v-icon>
                                基本資料
                            </div>
                            
                            <div>
                                <v-tooltip text="編輯" location="top" v-if="!isEditingProfile">
                                  <template v-slot:activator="{ props }">
                                    <v-btn 
                                      v-bind="props"
                                      icon="mdi-pencil" 
                                      variant="text" 
                                      size="small" 
                                      color="primary" 
                                      @click="startEditProfile"
                                    ></v-btn>
                                  </template>
                                </v-tooltip>
                                <div v-else class="d-flex align-center">
                                    <v-btn color="grey-darken-1" variant="text" size="small" class="mr-2" @click="cancelEditProfile" :disabled="isSavingProfile">取消</v-btn>
                                    <v-btn color="success" variant="elevated" size="small" prepend-icon="mdi-content-save" @click="saveProfile" :loading="isSavingProfile">儲存</v-btn>
                                </div>
                            </div>
                        </v-card-title>

                        <v-card-text class="pt-4" style="overflow-y: auto; max-height: calc(100vh - 150px);">
                            <div v-if="!isEditingProfile">
                               <div class="info-row mb-3">
    <span class="text-caption text-grey">姓名</span>
    <div class="d-flex align-center">
        <div class="text-body-1 font-weight-medium mr-2">{{ displayedName }}</div>
        
        <v-chip
            v-if="getProfileDisplayValue('性別')"
            size="x-small"
            variant="flat"
            class="font-weight-bold px-2"
            :color="getProfileDisplayValue('性別') === '男' ? 'blue-lighten-5' : (getProfileDisplayValue('性別') === '女' ? 'pink-lighten-5' : 'grey-lighten-4')"
            :class="getProfileDisplayValue('性別') === '男' ? 'text-blue-darken-3' : (getProfileDisplayValue('性別') === '女' ? 'text-pink-darken-3' : 'text-grey-darken-3')"
        >
            <v-icon start size="small" class="mr-1">
                {{ getProfileDisplayValue('性別') === '男' ? 'mdi-gender-male' : (getProfileDisplayValue('性別') === '女' ? 'mdi-gender-female' : 'mdi-help') }}
            </v-icon>
            {{ getProfileDisplayValue('性別') }}
        </v-chip>
    </div>
</div>
                                <div class="info-row mb-3">
                                    
                                <span class="text-caption text-grey">主電話</span>
                                <div class="text-h6 text-primary">
                                    <v-icon size="x-small" start>mdi-phone</v-icon>
                                    <a :href="`tel:${guestData.phone}`" class="text-decoration-none text-primary">
                                        {{ guestData.phone }}
                                    </a>
                                </div>
                            </div>

                                 <div class="info-row mb-3">
    <span class="text-caption text-grey">目前居住</span>
    
    <div class="d-flex flex-column">
        <template v-if="addressList.length > 0">
            <div v-for="(addr, idx) in addressList" :key="idx" class="mb-1">
                <div v-if="idx === 0" class="text-body-1 font-weight-bold text-high-emphasis">
                    {{ addr.fullAddress }}
                </div>
                <div v-else class="text-caption text-grey d-flex align-center mt-1">
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
                <div v-if="idx === 0" class="text-body-1 font-weight-bold text-high-emphasis">
                    {{ item.full }}
                </div>
                <div v-else class="text-caption text-grey d-flex align-center mt-1">
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
                                    <v-btn 
                                        size="small" 
                                        color="primary" 
                                        variant="text" 
                                        prepend-icon="mdi-plus" 
                                        @click="openAddPhoneDialog"
                                    >
                                        新增
                                    </v-btn>
                                </div>

                          
                               

                                <div v-if="guestData.otherPhones && guestData.otherPhones.length > 0">
                                <div v-for="(p, idx) in guestData.otherPhones" :key="idx" class="mb-3 pa-3 bg-grey-lighten-5 rounded">
                                    <div class="d-flex align-center justify-space-between">
                                        <span class="font-weight-bold">{{ p.name }}</span>
                                        <v-chip size="small" v-if="p.relation">{{ p.relation }}</v-chip>
                                    </div>
                                    
                                    <div class="text-body-2 mt-1 d-flex align-center">
                                        <v-icon size="small" start>mdi-phone</v-icon>
                                        <a :href="`tel:${p.phone}`" class="text-decoration-none text-high-emphasis font-weight-medium">
                                            {{ p.phone }}
                                        </a>
                                    </div>
                                </div>
                            </div>
                                <div v-else class="text-grey text-caption font-italic">無其他聯絡電話</div>

                                 <v-divider class="my-4"></v-divider>

                                <div v-if="guestData.profile" class="mt-4">
                                    <div class="d-flex align-center mb-2">
                                        <v-icon size="small" color="grey-darken-1" class="mr-1">mdi-text-box-search-outline</v-icon>
                                        <span class="text-caption text-grey-darken-2 font-weight-bold">詳細需求</span>
                                    </div>
                                    
                                    <div class="bg-grey-lighten-4 rounded pa-2 border border-dashed">
                                        <v-row dense>
                                            <v-col 
                                                v-for="field in sortedProfileFields" 
                                                :key="field.key" 
                                                cols="12" 
                                                lg="6" 
                                                class="py-1"
                                            >
                                                <div class="d-flex flex-column">
                                                    <span class="text-caption text-grey" style="font-size: 0.7rem;">{{ field.label }}</span>
                                                    <div class="text-body-2 font-weight-medium text-grey-darken-3" style="min-height: 24px; line-height: 1.4;">
                                                        <template v-if="Array.isArray(guestData.profile[field.label])">
                                                            <div v-if="guestData.profile[field.label].length > 0" class="d-flex flex-wrap gap-1">
                                                                <v-chip 
                                                                    v-for="item in guestData.profile[field.label]" 
                                                                    :key="item"
                                                                    size="small" 
                                                                    variant="tonal" 
                                                                    color="blue-grey-darken-1"
                                                                    class="px-1"
                                                                    style="height: 20px;"
                                                                >
                                                                    {{ item }}
                                                                </v-chip>
                                                            </div>
                                                            <span v-else class="text-grey-lighten-1">-</span>
                                                        </template>
                                                        <template v-else>
                                                            {{ guestData.profile[field.label] || '-' }}
                                                        </template>
                                                    </div>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </div>
                                </div>
                           
                                
                                <div class="mt-6 pt-4 border-t text-caption text-grey-lighten-1">
                                    <div>建立時間: {{ guestData.createdAt ? new Date(guestData.createdAt).toLocaleString() : '-' }}</div>
                               
                                </div>
                            </div>

                            <v-form v-else ref="profileForm">
    <v-text-field 
        label="姓名" 
        v-model="editingData.latestName" 
        variant="outlined" 
        density="compact"
        :rules="[v => !!v || '必填']"
        class="mb-3"
    ></v-text-field>

    <div class="mb-4">
        <div class="text-caption text-grey mb-1">性別</div>
        <v-btn-toggle
            v-model="editingData.profile['性別']"
            color="primary"
            variant="outlined"
            density="compact"
            divided
            mandatory
        >
            <v-btn value="男" size="small" prepend-icon="mdi-gender-male">男</v-btn>
            <v-btn value="女" size="small" prepend-icon="mdi-gender-female">女</v-btn>
        </v-btn-toggle>
    </div>

    <v-divider class="mb-4 border-dashed"></v-divider>

    <div class="text-caption text-primary font-weight-bold mb-2">
        <v-icon size="small" start>mdi-home-map-marker</v-icon>居住地址
    </div>
    <v-row dense>
        <v-col cols="6">
            <v-autocomplete 
                label="城市" 
                v-model="editingData.profile['居住城市']" 
                :items="cityOptions"
                density="compact" 
                variant="outlined" 
                hide-details="auto"
                class="mb-2"
                placeholder="請選擇"
            ></v-autocomplete>
        </v-col>
        <v-col cols="6">
            <v-autocomplete 
                label="鄉鎮市區" 
                v-model="editingData.profile['居住鄉鎮市區']" 
                :items="districtOptions"
                :disabled="!editingData.profile['居住城市']"
                density="compact" 
                variant="outlined" 
                hide-details="auto"
                class="mb-2"
                placeholder="請選擇"
                no-data-text="請先選擇城市"
            ></v-autocomplete>
        </v-col>
        <v-col cols="12">
            <v-text-field 
                label="詳細地址" 
                v-model="editingData.profile['居住詳細地址']" 
                density="compact" 
                variant="outlined" 
                hide-details="auto"
                class="mb-3"
                placeholder="街道巷弄號樓"
            ></v-text-field>
        </v-col>
    </v-row>

    <div class="text-caption text-primary font-weight-bold mb-2 mt-2">
        <v-icon size="small" start>mdi-briefcase</v-icon>職業資訊
    </div>
    <v-row dense>
        <v-col cols="6">
            <v-text-field 
                label="職業" 
                v-model="editingData.profile['職業']" 
                density="compact" 
                variant="outlined" 
                hide-details="auto"
                class="mb-2"
            ></v-text-field>
        </v-col>
        <v-col cols="6">
            <v-text-field 
                label="任職公司" 
                v-model="editingData.profile['任職公司']" 
                density="compact" 
                variant="outlined" 
                hide-details="auto"
                class="mb-2"
            ></v-text-field>
        </v-col>
    </v-row>
    
    <v-divider class="my-4 border-dashed"></v-divider>

    <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-subtitle-2">其他聯絡電話</span>
        <v-btn size="small" color="primary" variant="text" prepend-icon="mdi-plus" @click="addPhoneField">新增</v-btn>
    </div>

    <div v-for="(p, idx) in editingData.otherPhones" :key="idx" class="mb-4 pa-3 border rounded bg-grey-lighten-5">
        <div class="d-flex justify-space-between mb-2">
            <span class="text-caption">聯絡人 {{ idx + 1 }}</span>
            <v-btn icon="mdi-delete" size="small" color="grey" variant="text" @click="removePhoneField(idx)"></v-btn>
        </div>
        <v-row dense>
            <v-col cols="6">
                <v-text-field label="姓名" v-model="p.name" density="compact" variant="outlined" hide-details class="mb-2"></v-text-field>
            </v-col>
            <v-col cols="6">
                <v-text-field label="關係" v-model="p.relation" density="compact" variant="outlined" hide-details class="mb-2"></v-text-field>
            </v-col>
            <v-col cols="12">
                <v-text-field label="電話" v-model="p.phone" density="compact" variant="outlined" hide-details></v-text-field>
            </v-col>
        </v-row>
    </div>
</v-form>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="8" class="fill-height d-flex flex-column">
                    
                    <v-card class="flex-grow-1 d-flex flex-column" elevation="1" style="min-height: 0;">
                         <v-card-title class="text-subtitle-1 font-weight-bold border-b d-flex align-center justify-space-between bg-grey-lighten-4">
                            <span>洽談紀錄 ({{ guestData.interactionLogs?.length || 0 }})</span>
                            
                            <v-btn 
                              color="teal" 
                              variant="flat" 
                              size="small"
                              prepend-icon="mdi-pen-plus"
                              @click="openAddLogDialog"
                            >
                              新增紀錄
                            </v-btn>
                         </v-card-title>

                         <v-card-text class="pa-0" style="overflow-y: auto;">
                            <div class="pa-4 d-flex flex-column gap-3">
                                
                                <div v-if="!guestData.interactionLogs?.length" class="text-center text-grey pa-4">
                                    尚無洽談紀錄
                                </div>

                                <v-card 
                                    v-for="log in guestData.interactionLogs"
                                    :key="log.logId"
                                    variant="outlined" 
                                    class="mb-3 border-s-4"
                                    style="border-left-color: #4DB6AC !important;"
                                >
                                    <v-card-text class="pa-3">
                                        
                                        <div class="d-flex flex-wrap align-center mb-2 pb-2 border-b">
                                            
                                            <div class="d-flex align-center mr-4">
                                                <v-icon size="small" color="primary" class="mr-1">mdi-account</v-icon>
                                                <span class="font-weight-bold text-subtitle-2 text-primary">
                                                    {{ guestData.latestName }}
                                                </span>
                                            </div>

                                            <div class="d-flex align-center mr-4">
                                                <v-icon size="small" color="grey" class="mr-1">mdi-calendar-clock</v-icon>
                                                <span class="text-caption text-grey-darken-2 font-weight-medium">
                                                    {{ log.date }}
                                                </span>
                                            </div>

                                            <div v-if="log.startTime && log.endTime" class="mr-2">
                                                <span class="text-caption text-grey-darken-1 font-weight-bold" style="font-family: monospace;">
                                                    {{ log.startTime }}~{{ log.endTime }}
                                                </span>
                                            </div>

                                            <div v-if="calculateDuration(log.startTime, log.endTime)" class="d-flex align-center mr-3">
                                                <v-chip
                                                    size="small"
                                                    color="teal-lighten-5"
                                                    class="text-teal-darken-3 font-weight-bold px-2"
                                                    variant="flat"
                                                    label
                                                >
                                                    <v-icon start size="small" class="mr-1">mdi-timer-outline</v-icon>
                                                    {{ calculateDuration(log.startTime, log.endTime) }} 分鐘
                                                </v-chip>
                                            </div>
                                           

                                           <v-chip 
                                                v-if="log.tags && log.tags['rating'] && log.tags['rating'].length" 
                                                size="small" 
                                                variant="flat"
                                                label
                                                class="font-weight-bold"
                                                :color="getRatingStyle(log.tags['rating']).color"
                                                :class="getRatingStyle(log.tags['rating']).textClass"
                                            >
                                                <span class="mr-1" style="opacity: 0.8;">等級:</span>
                                                <span>
                                                    {{ Array.isArray(log.tags['rating']) ? log.tags['rating'].join(', ') : log.tags['rating'] }}
                                                </span>
                                            </v-chip>

                                            <v-spacer></v-spacer>
                                            
                                            <span class="text-caption text-grey mr-2">
                                                記錄人: {{ log.recorderName }}
                                            </span>

                                           <v-btn
                                                v-if="canEdit || log.recorderName === userStore.user?.name"
                                                icon="mdi-pencil"
                                                variant="text"
                                                size="x-small"
                                                color="grey-darken-1"
                                                @click="openEditLog(log)"
                                                title="編輯此紀錄"
                                            ></v-btn>

                                        </div>

                                        <div class="mb-2 d-flex flex-wrap gap-1">
                                            <template v-for="(val, key) in log.tags" :key="key">
                                                <v-chip 
                                                    v-if="key !== 'rating' && val && val.length" 
                                                    size="small" 
                                                    color="blue-grey-lighten-4" 
                                                    variant="flat"
                                                    class="mr-1 mb-1"
                                                    label
                                                >
                                                    <span class="text-grey-darken-2 mr-1">{{ getFieldLabel(key) }}:</span>
                                                    <span class="font-weight-bold text-blue-grey-darken-3">
                                                        {{ Array.isArray(val) ? val.join(', ') : val }}
                                                    </span>
                                                </v-chip>
                                            </template>
                                        </div>
                                        
                                        <div class="text-body-2 text-grey-darken-3 pl-1" style="white-space: pre-wrap; line-height: 1.6;">{{ log.content }}</div>
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
    
    <v-dialog v-model="isAddLogDialogVisible" max-width="600px" persistent>
      <v-card>
        <v-card-title class="bg-teal text-white d-flex align-center">
          <v-icon start>{{ editingLogId ? 'mdi-pencil' : 'mdi-pen-plus' }}</v-icon>
          {{ editingLogId ? '編輯洽談紀錄' : '新增洽談紀錄' }}
        </v-card-title>

        <v-card-text class="pt-4">
<v-row>
              <v-col cols="12" sm="6">
                   <VueDatePicker 
                      v-model="newLog.date" 
                      :teleport="true"
                      :enable-time-picker="false"
                      format="yyyy-MM-dd"
                      auto-apply
                      placeholder="選擇日期"
                      locale="zh-TW"
                      :max-date="new Date()"
                  ></VueDatePicker>
              </v-col>
          </v-row>
          
          <v-row dense class="mt-2">
            <v-col cols="6">
              <v-text-field
                v-model="newLog.startTime"
                label="開始時間"
                type="time"
                variant="outlined"
                density="compact"
               
                hide-details="auto"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newLog.endTime"
                label="結束時間"
                type="time"
                variant="outlined"
                density="compact"
                
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <div class="mt-4">
              <v-row dense>
                <template v-for="(fieldKey, idx) in logFields" :key="idx">
                    
                    <v-col cols="12" v-if="fieldKey === 'keyTags' && fieldSettings[fieldKey]">
                        <div class="d-flex align-center mb-1">
                            <span class="text-caption text-grey-darken-1">{{ fieldSettings[fieldKey].label }}</span>
                            <v-btn 
                                size="small" 
                                variant="text" 
                                color="primary" 
                                class="ml-2"
                                prepend-icon="mdi-tag-plus-outline"
                                @click="openTagDialog"
                            >
                                加入標籤
                            </v-btn>
                        </div>
                      <div class="d-flex flex-wrap gap-2 py-2 px-3 bg-grey-lighten-5 rounded border" style="min-height: 48px; align-items: center;">
                            <span v-if="!newLog.tags[fieldKey] || newLog.tags[fieldKey].length === 0" class="text-caption text-grey">
                                未選擇任何標籤...
                            </span>
                            
                            <v-chip 
                                v-for="tag in newLog.tags[fieldKey]" 
                                :key="tag"
                                size="small"
                                color="blue-grey"
                                variant="tonal"
                                label
                                closable
                                @click:close="removeTag(tag)"
                            >
                                {{ tag }}
                            </v-chip>
                        </div>
                    </v-col>

                    <v-col cols="12" sm="6" v-else-if="fieldSettings[fieldKey]">
                        <v-select
                            v-model="newLog.tags[fieldKey]"
                            :label="fieldSettings[fieldKey].label"
                            :items="getOptions(fieldKey)"
                            :multiple="fieldSettings[fieldKey].selectionMode === 'multiple'"
                            density="compact"
                            variant="outlined"
                            :rules="[v => (Array.isArray(v) ? v.length > 0 : !!v) || '必填']"
                            hide-details="auto"
                            class="mb-2"
                        ></v-select>
                    </v-col>
                </template>
             </v-row>
          </div>

          <v-textarea
              v-model="newLog.content"
              label="洽談內容 (必填)"
              variant="outlined"
              rows="5"
              class="mt-4"
              placeholder="請輸入詳細洽談內容..."
              :rules="[v => !!v || '內容為必填']"
          ></v-textarea>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text" 
            @click="closeLogDialog"
            :disabled="isAddingLog"
          >
            取消
          </v-btn>
          <v-btn 
            color="teal" 
            variant="elevated" 
            @click="handleSaveLog"
            :loading="isAddingLog"
            :disabled="!isValidLog"
          >
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
                <v-chip-group
                    v-model="tempTags"
                    column
                    multiple
                    filter
                    selected-class="text-primary"
                >
                    <v-chip
                        v-for="option in keyTagsOptions"
                        :key="option"
                        :value="option"
                        variant="outlined"
                        filter
                    >
                        {{ option }}
                    </v-chip>
                    <v-chip
                        v-for="custom in tempCustomTags"
                        :key="custom"
                        :value="custom"
                        variant="outlined"
                        filter
                    >
                        {{ custom }} (自訂)
                    </v-chip>
                </v-chip-group>

                <div v-if="fieldSettings['keyTags']?.allowCustom" class="mt-4 pt-4 border-t">
                    <v-text-field
                        v-model="customTagInput"
                        label="新增自訂標籤"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="輸入後按 Enter"
                        append-inner-icon="mdi-plus"
                        @click:append-inner="addCustomTag"
                        @keydown.enter.prevent="addCustomTag"
                    ></v-text-field>
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
            <v-text-field 
              label="姓名" 
              v-model="newPhoneData.name" 
              variant="outlined" 
              density="compact"
              :rules="[v => !!v || '必填']"
              class="mb-2"
            ></v-text-field>
            <v-text-field 
              label="關係" 
              v-model="newPhoneData.relation" 
              variant="outlined" 
              density="compact"
              class="mb-2"
            ></v-text-field>
            <v-text-field 
              label="電話" 
              v-model="newPhoneData.phone" 
              variant="outlined" 
              density="compact"
              :rules="[v => !!v || '必填']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isAddPhoneDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleAddNewPhone" :loading="isSavingPhone">確認新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-overlay :model-value="isLoading" class="align-center justify-center" persistent>
      <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useUserStore } from '@/store/user';
// ✅ [新增] 引入 updateInteractionLog
import { fetchCustomerInteractionDetails, addInteractionLog, updateCustomerProfile, updateInteractionLog } from '@/api';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useToast } from 'vue-toastification';
import TwCities from '@/assets/TwCities.json'; // 請確保檔案路徑正確，或直接在此定義變數

const props = defineProps({
  show: Boolean,
  projectId: String,
  docId: String,
  settings: { type: Object, default: () => ({}) } 
});

const emit = defineEmits(['update:show', 'data-updated']);
const userStore = useUserStore();
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

// [新增] 計算持續時間 (分鐘)
const calculateDuration = (start, end) => {
    if (!start || !end) return null;
    
    try {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        
        const diff = endTotal - startTotal;
        
        // 只回傳大於 0 的合理數值
        return diff > 0 ? diff : null;
    } catch (e) {
        return null;
    }
};

// ✅ [新增] 編輯 ID 狀態
const editingLogId = ref(null);

const guestData = ref({
    latestName: '',
    phone: '',
    otherPhones: [],
    interactionLogs: [],
    profile: {},
    submissions: [] // ✅ 確保初始化包含 submissions
});

const editingData = ref({});

// 新增/編輯紀錄表單
const newLog = ref({
    date: new Date(),
    content: '',
    tags: {}
});

const tempTags = ref([]);
const customTagInput = ref('');

const addPhoneForm = ref(null);
const newPhoneData = ref({ name: '', relation: '', phone: '' });

const logFields = ['visitors', 'interactionType', 'noPurchaseReason', 'keyTags', 'rating'];
const fieldSettings = computed(() => props.settings.fields || {});

const isValidLog = computed(() => {
    if (!newLog.value.content) return false;
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


// [新增] 通用輔助函式：從 Profile 欄位取得單一顯示值
// 如果是陣列，取最後一個(最新)；如果是字串，直接回傳
const getProfileDisplayValue = (key) => {
    const val = guestData.value.profile?.[key];
    if (Array.isArray(val)) {
        return val.length > 0 ? val[val.length - 1] : '';
    }
    return val || '';
};

// ==========================================
// ✅ [新增] 地址連動邏輯
// ==========================================

// 1. 取得所有縣市名稱
const cityOptions = computed(() => {
    return TwCities.map(c => c.name);
});

// 2. 根據目前選擇的城市，取得對應的鄉鎮市區
const districtOptions = computed(() => {
    // 取得目前編輯中的城市
    const currentCity = editingData.value.profile?.['居住城市'];
    if (!currentCity) return [];

    // 在 JSON 中尋找對應的城市物件
    const cityData = TwCities.find(c => c.name === currentCity);
    
    // 回傳該城市的 districts 名稱陣列
    return cityData ? cityData.districts.map(d => d.name) : [];
});

// 3. 監聽城市改變，自動清空鄉鎮市區 (避免選了台北市卻留著竹北市的區)
// 注意：我們只在「編輯模式」且「值真的改變」時才清空
watch(() => editingData.value.profile?.['居住城市'], (newVal, oldVal) => {
    if (isEditingProfile.value && newVal !== oldVal && oldVal !== undefined) {
        // 如果 profile 物件存在，則清空鄉鎮市區
        if (editingData.value.profile) {
            editingData.value.profile['居住鄉鎮市區'] = null;
        }
    }
});

// 取得最新完整地址
const latestFullAddress = computed(() => {
  // 優先從 submissions 獲取最新一筆，確保資料一致性
  const subs = guestData.value.submissions || [];
  if (subs.length > 0) {
    // submissions 是依時間序排列 (最新的在最後或最前，視您的排序邏輯而定)
    // 假設您的後端是 arrayUnion，通常是 append，所以最後一筆是新的
    // 但您的 fetchCustomerInteractionDetails 有做排序: sort((a, b) => new Date(b.date) - new Date(a.date))
    // 讓我們檢查 submissions 的排序。通常 submissions 陣列順序是 [舊, ..., 新]
    
    const latest = subs[subs.length - 1];
    const city = latest['居住城市'] || '';
    const district = latest['居住鄉鎮市區'] || '';
    const address = latest['居住詳細地址'] || '';
    
    if (city || district || address) {
      return `${city}${district}${address}`;
    }
  }

  // 降級：如果 submissions 為空，才嘗試從 profile 讀取
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

// 取得歷史地址列表 (用於 Tooltip 或展開顯示)
const addressHistory = computed(() => {
  const subs = guestData.value.submissions || [];
  if (subs.length <= 1) return []; // 只有一筆就不顯示歷史

  // 反轉陣列讓最新的在上面，並過濾掉空地址
  return [...subs].reverse().map(sub => {
    const city = sub['居住城市'] || '';
    const district = sub['居住鄉鎮市區'] || '';
    const address = sub['居住詳細地址'] || '';
    const full = `${city}${district}${address}`;
    return {
      date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '未知日期',
      fullAddress: full
    };
  }).filter(item => item.fullAddress); // 只回傳有地址的紀錄
});


// 1. 萬用時間解析函式 (提取出來供大家共用)
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
         return timeA - timeB; // 由舊到新
    });
};

// [修改] 計算地址變更歷史 (優先讀取 Profile 作為最新資料)
const addressList = computed(() => {
    const history = [];
    const p = guestData.value.profile || {};

    // 1. 【關鍵修正】直接從 Profile 獲取「目前」的最新狀態
    // 輔助函式：如果是陣列取最後一個，如果是字串直接用
    const getProfileVal = (k) => {
        const val = p[k];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    const currentCity = getProfileVal('居住城市');
    const currentDist = getProfileVal('居住鄉鎮市區');
    const currentAddr = getProfileVal('居住詳細地址');
    const currentFull = `${currentCity}${currentDist}${currentAddr}`;

    // 加入第一筆：目前的最新資料 (來自 Profile/編輯後的結果)
    if (currentFull) {
        history.push({ 
            date: '目前', 
            fullAddress: currentFull 
        });
    }

    // 2. 處理歷史 Submissions
    const sortedSubs = getSortedSubmissions(); // 由舊到新排序
    // 反轉為由新到舊，方便比對
    const reverseSubs = [...sortedSubs].reverse();

    reverseSubs.forEach(sub => {
        const c = sub['居住城市'] || '';
        const d = sub['居住鄉鎮市區'] || '';
        const a = sub['居住詳細地址'] || '';
        const subFull = `${c}${d}${a}`;

        // 只有當歷史紀錄有值，且與「目前最新」不同，才列入歷史
        // 或者您希望列出所有變更軌跡，可以只比對上一個加入 history 的值
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

// 4. [新增] 通用單一欄位歷史產生器 (用於職業、任職公司)
const getSimpleFieldHistory = (fieldName) => {
    const sortedSubs = getSortedSubmissions();

    // 如果沒有提交紀錄，降級讀取 profile
    if (sortedSubs.length === 0) {
        const p = guestData.value.profile || {};
        // 處理可能的陣列結構
        const valArr = p[fieldName];
        const val = Array.isArray(valArr) ? (valArr.length > 0 ? valArr[valArr.length - 1] : '') : (valArr || '');
        return val ? [{ value: val, date: '目前' }] : [];
    }

    const history = [];
    let lastVal = '';

    sortedSubs.forEach(sub => {
        const val = sub[fieldName] || '';
        // 只有當值存在且與上一次不同時才加入
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

// [修改] 合併「職業/任職公司」的歷史紀錄 (優先讀取 Profile)
const careerList = computed(() => {
    const history = [];
    const p = guestData.value.profile || {};

    // 1. 【關鍵修正】直接從 Profile 獲取「目前」的最新狀態
    const getProfileVal = (k) => {
        const val = p[k];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    const currentProf = getProfileVal('職業') || '-';
    const currentComp = getProfileVal('任職公司') || '-';
    const currentFull = `${currentProf} / ${currentComp}`;

    // 加入第一筆：目前的最新資料
    if (currentProf !== '-' || currentComp !== '-') {
        history.push({
            date: '目前',
            full: currentFull
        });
    }

    // 2. 處理歷史 Submissions
    const sortedSubs = getSortedSubmissions();
    const reverseSubs = [...sortedSubs].reverse(); // 由新到舊

    reverseSubs.forEach(sub => {
        const prof = sub['職業'] || '-';
        const comp = sub['任職公司'] || '-';
        const subFull = `${prof} / ${comp}`;

        // 比對上一筆加入的歷史資料 (或是目前的最新資料)
        const lastHistoryVal = history.length > 0 ? history[history.length - 1].full : '';

        // 只有當內容不同時才加入歷史
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

const loadData = async () => {
    console.log("CustomerInteractionLog: 準備載入資料, docId:", props.docId);

    if (!props.docId) {
        console.warn("CustomerInteractionLog: 缺少 docId，跳過載入。");
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
            console.log("CustomerInteractionLog: 資料載入成功", result.data);
            guestData.value = result.data.guestData;
            canEdit.value = result.data.canEdit;
            
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

const startEditProfile = () => {
    // 深拷貝原始資料
    const rawData = JSON.parse(JSON.stringify(guestData.value));
    
    // 初始化編輯物件
    editingData.value = {
        latestName: rawData.latestName,
        otherPhones: rawData.otherPhones || [],
        profile: rawData.profile || {}
    };

    // 內部輔助：轉陣列為字串
    const getSingleValue = (key) => {
        const val = editingData.value.profile[key];
        return Array.isArray(val) ? (val.length > 0 ? val[val.length - 1] : '') : (val || '');
    };

    // ✅ [關鍵] 強制將 '性別' 轉為字串，這樣 v-btn-toggle 才能正確顯示選取狀態
    const fieldsToFlatten = ['職業', '任職公司', '居住城市', '居住鄉鎮市區', '居住詳細地址', '性別'];
    
    fieldsToFlatten.forEach(key => {
        editingData.value.profile[key] = getSingleValue(key);
    });
    
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
        // [新增] 準備要更新的 Profile 欄位
        // 這些欄位將直接寫入 profile map 中
        const targetProfileFields = [
            '性別', 
            '職業', '任職公司', 
            '居住城市', '居住鄉鎮市區', '居住詳細地址'
        ];

        const profileUpdates = {};
        targetProfileFields.forEach(key => {
            // 使用 'profile.欄位名' 格式，讓 Firestore 進行部分更新
            profileUpdates[`profile.${key}`] = editingData.value.profile[key] || '';
        });

        // 組合 API Payload
        const apiPayload = {
            latestName: editingData.value.latestName,
            otherPhones: editingData.value.otherPhones,
            ...profileUpdates // 展開 profile 更新欄位
        };
        
        await updateCustomerProfile(
            props.projectId,
            props.docId,
            apiPayload,
            userStore.user.key
        );
        
        // --- 更新本地視圖資料 ---
        guestData.value.latestName = editingData.value.latestName;
        guestData.value.otherPhones = editingData.value.otherPhones;
        
        if (!guestData.value.profile) guestData.value.profile = {};
        
        // [新增] 將編輯後的值寫回本地 profile (注意：這裡直接存字串，顯示端會自動處理)
        targetProfileFields.forEach(key => {
            guestData.value.profile[key] = editingData.value.profile[key];
        });
        
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

const openAddLogDialog = () => {
    editingLogId.value = null;
    
    // 設定預設時間：開始時間為現在，結束時間空白
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    
    newLog.value = {
        date: new Date(),
        startTime: ``,
        endTime: '',
        content: '',
        tags: {}
    };
    isAddLogDialogVisible.value = true;
};

// ✅ [修改] 編輯時讀取既有的時間資料
const openEditLog = (log) => {
    editingLogId.value = log.logId;
    newLog.value = {
        date: new Date(log.date),
        startTime: log.startTime || '', // 讀取開始時間
        endTime: log.endTime || '',     // 讀取結束時間
        content: log.content,
        tags: JSON.parse(JSON.stringify(log.tags || {}))
    };
    isAddLogDialogVisible.value = true;
};

// ✅ [修改] 關閉時重置
const closeLogDialog = () => {
    isAddLogDialogVisible.value = false;
    editingLogId.value = null;
    // 重置包含時間欄位
    newLog.value = { date: new Date(), startTime: '', endTime: '', content: '', tags: {} };
};

// ✅ [修改] 儲存時將時間欄位寫入 Payload
const handleSaveLog = async () => {
    if (!newLog.value.content) return;
    
    isAddingLog.value = true;
    try {
        const logPayload = {
            date: newLog.value.date ? new Date(newLog.value.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            startTime: newLog.value.startTime || '', // 寫入開始時間
            endTime: newLog.value.endTime || '',     // 寫入結束時間
            content: newLog.value.content,
            tags: { ...newLog.value.tags }
        };

        if (editingLogId.value) {
            // 更新紀錄
            await updateInteractionLog(
                props.projectId,
                props.docId,
                editingLogId.value,
                logPayload,
                userStore.user.name,
                userStore.user.phone // ✅ 新增：傳入更新者的電話
            );
            toast.success('紀錄已更新');
        } else {
            // 新增紀錄
            await addInteractionLog(
                props.projectId,
                props.docId,
                logPayload,
                userStore.user.name,
                userStore.user.phone // ✅ 新增：傳入目前記錄人員的電話
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

// --- 標籤 Dialog ---

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

    // 1. 取出所有提交紀錄中的姓名
    // 2. 過濾掉空值以及與目前 latestName 相同的名字
    const pastNames = subs
        .map(s => s['姓名'])
        .filter(n => n && n !== current);
    
    // 3. 去除重複的曾用名
    const uniquePastNames = [...new Set(pastNames)];

    // 4. 格式化輸出
    if (uniquePastNames.length > 0) {
        return `${current}(${uniquePastNames.join('、')})`;
    }
    
    return current;
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

function getRatingStyle(rating) {
    const val = Array.isArray(rating) ? rating[0] : rating;
    
    if (!val) return { color: 'grey-lighten-2', textClass: 'text-grey-darken-2' };
    
    if (val.includes('A')) return { color: 'red-lighten-4', textClass: 'text-red-darken-4' }; // A級
    if (val.includes('B')) return { color: 'orange-lighten-4', textClass: 'text-orange-darken-4' }; // B級
    if (val.includes('C')) return { color: 'green-lighten-4', textClass: 'text-green-darken-4' }; // C級
    if (val.includes('D')) return { color: 'grey-lighten-3', textClass: 'text-grey-darken-2' }; // D級
    
    return { color: 'blue-grey-lighten-4', textClass: 'text-blue-grey-darken-3' };
}

onMounted(() => {
    if (props.show && props.docId) {
        loadData();
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
</style>