<template>
    <v-container fluid class="pa-4">
        <div v-if="isLoading" class="d-flex justify-center align-center flex-grow-1 pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else>
            <v-row>
                <!-- 左側：設定表單 -->
                <v-col cols="12" md="8">
                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="bg-grey-lighten-4 d-flex align-center">
                            <v-icon start color="primary">mdi-file-pdf-box</v-icon>
                            封面設定
                        </v-card-title>
                        <v-card-text class="pt-4">
                            <v-text-field v-model="templateConfig.cover.title" label="封面大標題" variant="outlined"
                                density="compact" hint="支援變數：{建案名稱}" persistent-hint class="mb-4"></v-text-field>

                            <v-switch v-model="templateConfig.cover.showProjectInfo" label="顯示建案與屋主資訊區塊" color="primary"
                                density="compact" class="mb-2"></v-switch>

                            <v-expand-transition>
                                <div v-if="templateConfig.cover.showProjectInfo"
                                    class="pl-4 mb-4 border-s-sm border-grey-lighten-2">
                                    <div class="text-subtitle-2 mb-2">啟用以下資訊欄位顯示：</div>
                                    <v-row dense>
                                        <v-col cols="12" sm="6"
                                            v-for="(field, index) in templateConfig.cover.infoFields" :key="index">
                                            <div class="d-flex align-center">
                                                <v-checkbox v-model="field.enabled" hide-details density="compact"
                                                    color="primary" class="flex-grow-0 shrink mr-1"
                                                    style="max-width: 36px; margin-top: -8px;"></v-checkbox>
                                                <v-text-field v-model="field.label" variant="underlined"
                                                    density="compact" hide-details single-line
                                                    :disabled="!field.enabled" class="flex-grow-1 pt-0 mt-0">
                                                    <template v-slot:append-inner>
                                                        <span
                                                            class="text-caption text-grey ml-2 d-flex align-center h-100 text-no-wrap"
                                                            style="white-space: nowrap;">{{
                                                                field.variable }}</span>
                                                    </template>
                                                </v-text-field>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-expand-transition>

                            <div class="d-flex align-center mt-2 mb-2">
                                <v-switch v-model="templateConfig.cover.showDisclaimer" label="啟用聲明文字區塊 (位於簽名欄上方)"
                                    color="primary" density="compact" hide-details></v-switch>
                            </div>
                            <v-textarea v-if="templateConfig.cover.showDisclaimer"
                                v-model="templateConfig.cover.disclaimer" label="聲明文字內容" variant="outlined"
                                density="compact" rows="3" auto-grow class="mb-4"></v-textarea>

                            <div class="d-flex align-center gap-4 mb-4">
                                <v-switch v-model="templateConfig.cover.showSignature" label="顯示簽名欄" color="primary"
                                    density="compact" hide-details class="flex-grow-0 mr-4"></v-switch>
                                <v-text-field v-if="templateConfig.cover.showSignature"
                                    v-model="templateConfig.cover.signatureLabel" label="簽名欄標題" variant="outlined"
                                    density="compact" hide-details></v-text-field>
                            </div>

                            <div class="d-flex align-center gap-4">
                                <v-switch v-model="templateConfig.cover.showDate" label="顯示產製日期" color="primary"
                                    density="compact" hide-details class="flex-grow-0 mr-4"></v-switch>
                                <v-text-field v-if="templateConfig.cover.showDate"
                                    v-model="templateConfig.cover.dateLabel" label="日期標題" variant="outlined"
                                    density="compact" hide-details></v-text-field>
                            </div>

                            <v-btn color="info" block variant="tonal" class="mt-6" prepend-icon="mdi-eye"
                                @click="isPreviewDialogVisible = true">預覽報告封面</v-btn>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="bg-grey-lighten-4 d-flex align-center">
                            <v-icon start color="teal">mdi-book-open-page-variant-outline</v-icon>
                            內頁設定
                        </v-card-title>
                        <v-card-text class="pt-4">
                            <v-text-field v-model="templateConfig.detail.headerNote" label="頁首備註文字 (可選)"
                                variant="outlined" density="compact" placeholder="例如：本報告僅供參考..."
                                class="mb-4"></v-text-field>
                            <v-text-field v-model="templateConfig.detail.footerNote" label="頁尾公司資訊 (可選)"
                                variant="outlined" density="compact" placeholder="例如：安熙智慧建案管理系統 提供"
                                class="mb-4"></v-text-field>

                            <v-row dense>
                                <v-col cols="12" sm="4">
                                    <v-switch v-model="templateConfig.detail.showInspectorName" label="顯示驗屋人員名稱"
                                        color="teal" density="compact" hide-details></v-switch>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-switch v-model="templateConfig.detail.showPhotos" label="顯示缺失照片" color="teal"
                                        density="compact" hide-details></v-switch>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-text-field v-model.number="templateConfig.detail.maxPhotosPerRecord"
                                        label="每筆紀錄最多照片數" type="number" min="1" max="6" variant="outlined"
                                        density="compact" hide-details
                                        :disabled="!templateConfig.detail.showPhotos"></v-text-field>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="bg-grey-lighten-4 d-flex align-center">
                            <v-icon start color="orange">mdi-email-outline</v-icon>
                            報告產製完成 Email 通知設定
                        </v-card-title>
                        <v-card-text class="pt-4">
                            <v-text-field v-model="templateConfig.email.subject" label="Email 主旨" variant="outlined"
                                density="compact" hint="可使用變數：{建案名稱}, {戶別}" persistent-hint class="mb-4"></v-text-field>

                            <div class="text-subtitle-2 mb-2 text-grey-darken-1">Email 內文 (支援 HTML)</div>
                            <!-- 可以考慮引入 RichTextEditor，但先用 textarea -->
                            <v-textarea v-model="templateConfig.email.bodyHtml" variant="outlined" density="compact"
                                rows="4" auto-grow hint="可使用變數：{建案名稱}, {戶別}, {產權人姓名}" persistent-hint
                                class="mb-4"></v-textarea>

                            <v-row dense class="align-center mb-4">
                                <v-col cols="12" sm="4">
                                    <v-switch v-model="templateConfig.email.showDriveButton" label="顯示「查看報告」按鈕"
                                        color="orange" density="compact" hide-details></v-switch>
                                </v-col>
                                <v-col cols="12" sm="8">
                                    <v-text-field v-if="templateConfig.email.showDriveButton"
                                        v-model="templateConfig.email.buttonText" label="按鈕文字" variant="outlined"
                                        density="compact" hide-details></v-text-field>
                                </v-col>
                            </v-row>

                            <v-text-field v-model="templateConfig.email.footerText" label="Email 頁尾文字"
                                variant="outlined" density="compact" hide-details></v-text-field>
                        </v-card-text>
                    </v-card>

                    <!-- 新增：報告夾帶附件區塊 -->
                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="bg-grey-lighten-4 d-flex align-center pb-2">
                            <v-switch v-model="templateConfig.emailAttachments.enabled" color="primary"
                                density="compact" hide-details class="flex-grow-0 mr-2"></v-switch>
                            <v-icon color="blue-grey" class="mr-2">mdi-paperclip</v-icon>
                            報告夾帶附件
                        </v-card-title>
                        <v-card-text class="pt-4" v-if="templateConfig.emailAttachments.enabled">
                            <v-file-input v-model="newAttachments" label="上傳附件 (可多選)" variant="outlined"
                                density="compact" prepend-icon="mdi-paperclip" multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" :loading="isUploading"
                                @change="handleUploadAttachments" hint="支援 PDF, Word, 圖片檔" persistent-hint
                                class="mb-4"></v-file-input>

                            <v-list v-if="templateConfig.emailAttachments.files.length > 0" density="compact"
                                class="border rounded">
                                <v-list-item v-for="(file, index) in templateConfig.emailAttachments.files"
                                    :key="index">
                                    <template v-slot:prepend>
                                        <v-icon :color="getFileIconColor(file.name)">{{ getFileIcon(file.name)
                                        }}</v-icon>
                                    </template>
                                    <v-list-item-title>
                                        <a :href="file.url" target="_blank"
                                            class="text-primary text-decoration-none font-weight-medium">
                                            {{ file.name }}
                                        </a>
                                    </v-list-item-title>
                                    <v-list-item-subtitle>{{ formatFileSize(file.size) }}</v-list-item-subtitle>
                                    <template v-slot:append>
                                        <v-btn icon="mdi-delete" variant="text" size="small" color="error"
                                            :loading="deletingAttachmentIndex === index"
                                            @click="handleDeleteAttachment(index)"></v-btn>
                                    </template>
                                </v-list-item>
                            </v-list>
                            <div v-else class="text-caption text-grey text-center py-4">目前尚無附件</div>
                        </v-card-text>
                    </v-card>

                    <v-btn color="success" size="large" block @click="saveTemplateSettings" :loading="isSaving"
                        prepend-icon="mdi-content-save">
                        儲存所有報告模板設定
                    </v-btn>
                </v-col>

                <!-- 右側：變數提示與說明 -->
                <v-col cols="12" md="4">
                    <v-card variant="flat" color="blue-lighten-5" class="mb-4">
                        <v-card-title class="text-subtitle-1 font-weight-bold text-blue-darken-3">
                            <v-icon start>mdi-information</v-icon>
                            可用變數說明
                        </v-card-title>
                        <v-card-text>
                            <p class="text-body-2 mb-2">您可以在文字框中插入以下變數，系統產製報告時會自動替換為真實資料：</p>
                            <v-table density="compact" class="bg-transparent">
                                <tbody>
                                    <tr>
                                        <td><code>{建案名稱}</code></td>
                                        <td>建案名稱</td>
                                    </tr>
                                    <tr>
                                        <td><code>{戶別}</code></td>
                                        <td>戶別編號</td>
                                    </tr>
                                    <tr>
                                        <td><code>{產權人姓名}</code></td>
                                        <td>買方姓名</td>
                                    </tr>
                                    <tr>
                                        <td><code>{產權人電話}</code></td>
                                        <td>買方聯絡電話</td>
                                    </tr>
                                    <tr>
                                        <td><code>{產權人EMAIL}</code></td>
                                        <td>買方電子信箱</td>
                                    </tr>
                                    <tr>
                                        <td><code>{驗屋日期}</code></td>
                                        <td>驗屋日期</td>
                                    </tr>
                                    <tr>
                                        <td><code>{紀錄筆數}</code></td>
                                        <td>總缺失紀錄數</td>
                                    </tr>
                                    <tr>
                                        <td><code>{確認日期}</code></td>
                                        <td>產權人線上確認日</td>
                                    </tr>
                                    <tr>
                                        <td><code>{產製日期}</code></td>
                                        <td>PDF 產生當日</td>
                                    </tr>
                                    <tr>
                                        <td><code>{驗屋人員}</code></td>
                                        <td>負責驗屋工程師</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>

        <!-- 預覽 Dialog -->
        <v-dialog v-model="isPreviewDialogVisible" max-width="800">
            <v-card>
                <v-card-title class="bg-primary text-white d-flex align-center">
                    <v-icon start>mdi-eye</v-icon>
                    預覽報告封面
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="isPreviewDialogVisible = false"></v-btn>
                </v-card-title>

                <v-card-text class="bg-grey-lighten-3 pa-6">
                    <!-- A4 模擬紙張 -->
                    <div class="bg-white pa-8 rounded elevation-2"
                        style="aspect-ratio: 1 / 1.414; margin: 0 auto; max-width: 600px; display: flex; flex-direction: column;">

                        <!-- 標題 -->
                        <div class="text-h4 font-weight-bold text-center mb-10 pt-10" style="color: #333;">
                            {{ parseVars(templateConfig.cover.title) }}
                        </div>

                        <!-- 資訊區塊 -->
                        <div v-if="templateConfig.cover.showProjectInfo" class="mb-10 text-body-1"
                            style="color: #444; line-height: 2;">
                            <div v-for="(field, i) in templateConfig.cover.infoFields" :key="i">
                                <template v-if="field.enabled">
                                    <span class="font-weight-bold">{{ field.label }}：</span>
                                    <span>{{ parseVars(field.variable) }}</span>
                                </template>
                            </div>
                        </div>

                        <v-spacer></v-spacer>

                        <!-- 底部區域 -->
                        <div class="mt-auto">
                            <!-- 聲明文字 -->
                            <div v-if="templateConfig.cover.showDisclaimer" class="mb-8 text-body-2"
                                style="color: #555; white-space: pre-wrap;">
                                {{ parseVars(templateConfig.cover.disclaimer) }}
                            </div>

                            <div class="d-flex justify-space-between align-end">
                                <!-- 產製日期 -->
                                <div>
                                    <template v-if="templateConfig.cover.showDate">
                                        {{ templateConfig.cover.dateLabel }} {{ parseVars('{產製日期}') }}
                                    </template>
                                </div>

                                <!-- 簽名欄 -->
                                <div v-if="templateConfig.cover.showSignature" class="text-right">
                                    <div class="mb-2">{{ templateConfig.cover.signatureLabel }}</div>
                                    <div
                                        style="width: 200px; height: 60px; border-bottom: 1px solid #000; display: inline-block;">
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="isPreviewDialogVisible = false">關閉預覽</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 內頁預覽 Dialog -->
        <v-dialog v-model="isDetailPreviewDialogVisible" max-width="800">
            <v-card>
                <v-card-title class="bg-teal text-white d-flex align-center">
                    <v-icon start>mdi-eye</v-icon>
                    預覽內頁排版
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" variant="text" @click="isDetailPreviewDialogVisible = false"></v-btn>
                </v-card-title>

                <v-card-text class="bg-grey-lighten-3 pa-6">
                    <!-- A4 模擬紙張 -->
                    <div class="bg-white pa-8 rounded elevation-2"
                        style="aspect-ratio: 1 / 1.414; margin: 0 auto; max-width: 600px; display: flex; flex-direction: column;">

                        <!-- 頁首備註 -->
                        <div class="text-caption text-right text-grey-darken-1 mb-4"
                            style="border-bottom: 1px solid #eee; padding-bottom: 4px;">
                            {{ parseVars(templateConfig.detail.headerNote) || '　' }}
                        </div>

                        <div class="text-h6 font-weight-bold text-center mb-6" style="color: #333;">
                            {{ parseVars('{建案名稱}') }} - {{ parseVars('{戶別}') }} 驗屋紀錄表
                        </div>

                        <!-- 模擬驗屋紀錄卡片 -->
                        <div v-for="record in 2" :key="record" class="border rounded pa-4 mb-4 bg-grey-lighten-5">
                            <div class="d-flex justify-space-between align-center mb-2">
                                <div class="font-weight-bold text-body-1">
                                    <v-chip size="small" color="primary" class="mr-2">{{ record === 1 ? '客廳' : '主臥室'
                                    }}</v-chip>
                                    {{ record === 1 ? '牆面油漆不平整' : '窗框漏水' }}
                                </div>
                            </div>
                            <div class="text-body-2 text-grey-darken-3 mb-3">
                                {{ record === 1 ? '油漆有多處刮痕與污漬，需要批土重新修補。' : '窗框矽利康龜裂，導致外部雨水滲入。' }}
                            </div>

                            <div class="d-flex align-center justify-space-between mb-3">
                                <span class="text-caption bg-amber-lighten-4 px-2 py-1 rounded">狀態: 待修繕</span>
                                <div v-if="templateConfig.detail.showInspectorName"
                                    class="text-caption text-grey-darken-2">
                                    檢驗人: {{ parseVars('{驗屋人員}') }}
                                </div>
                            </div>

                            <!-- 模擬缺失照片 -->
                            <div v-if="templateConfig.detail.showPhotos" class="d-flex gap-2 flex-wrap mt-2">
                                <div v-for="i in templateConfig.detail.maxPhotosPerRecord" :key="i"
                                    class="d-flex flex-column align-center justify-center bg-grey-lighten-3 border rounded elevation-1"
                                    style="width: 80px; height: 80px; flex-shrink: 0;">
                                    <v-icon color="grey-darken-1">mdi-image-outline</v-icon>
                                </div>
                            </div>
                        </div>

                        <v-spacer></v-spacer>

                        <!-- 頁尾資訊 -->
                        <div class="text-caption text-center text-grey-darken-1 mt-6 pt-2"
                            style="border-top: 1px solid #eee;">
                            {{ parseVars(templateConfig.detail.footerNote) || '　' }}<br>
                            第 1 頁 / 共 3 頁
                        </div>

                    </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="isPreviewDialogVisible = false">關閉預覽</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar 提示框 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
            {{ snackbar.text }}
            <template v-slot:actions>
                <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProjectSettings, updateProjectSettings, uploadAttachmentImage, deleteAttachmentImage } from '@/api';
import { useSnackbar } from '@/composables/useSnackbar';

const props = defineProps({
    projectId: {
        type: String,
        required: true
    }
});

const { showSnackbar, snackbar } = useSnackbar();

const isLoading = ref(true);
const isSaving = ref(false);
const isPreviewDialogVisible = ref(false);

const newAttachments = ref([]);
const isUploading = ref(false);
const deletingAttachmentIndex = ref(null);

const getFileIcon = (filename) => {
    if (!filename) return 'mdi-file';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'mdi-file-pdf-box';
    if (['doc', 'docx'].includes(ext)) return 'mdi-file-word-box';
    return 'mdi-image-outline';
};

const getFileIconColor = (filename) => {
    if (!filename) return 'grey';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'red';
    if (['doc', 'docx'].includes(ext)) return 'blue';
    return 'green';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const handleUploadAttachments = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    isUploading.value = true;
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const result = await uploadAttachmentImage(props.projectId, file);
            if (result && result.url && result.path) {
                templateConfig.value.emailAttachments.files.push({
                    name: file.name,
                    size: file.size,
                    url: result.url,
                    path: result.path
                });
            }
        }
        showSnackbar('附件上傳成功', 'success');
    } catch (error) {
        console.error('上傳附件失敗:', error);
        showSnackbar('上傳失敗，請稍後再試', 'error');
    } finally {
        isUploading.value = false;
        newAttachments.value = [];
    }
};

const handleDeleteAttachment = async (index) => {
    const fileToDel = templateConfig.value.emailAttachments.files[index];
    if (!confirm(`確定要刪除附件「${fileToDel.name}」嗎？`)) return;

    deletingAttachmentIndex.value = index;
    try {
        if (fileToDel.path) {
            await deleteAttachmentImage(fileToDel.path);
        }
        templateConfig.value.emailAttachments.files.splice(index, 1);
        showSnackbar('附件已刪除', 'success');
    } catch (error) {
        console.error('刪除附件失敗:', error);
        showSnackbar('刪除失敗，這可能表示檔案不存在或權限不足', 'error');
        // 如果實際檔案不存在，仍允許從設定中移除
        templateConfig.value.emailAttachments.files.splice(index, 1);
    } finally {
        deletingAttachmentIndex.value = null;
    }
};

const mockData = {
    '{建案名稱}': 'XX社區',
    '{戶別}': 'A1-5F',
    '{產權人姓名}': '王小明',
    '{產權人電話}': '0912-345-678',
    '{產權人EMAIL}': 'ming@example.com',
    '{驗屋日期}': '2025/11/20',
    '{紀錄筆數}': '5',
    '{確認日期}': '2025/11/21',
    '{產製日期}': '2025/11/22',
    '{驗屋人員}': '李工程師'
};

const parseVars = (text) => {
    if (!text) return '';
    let parsedText = text;
    for (const [key, value] of Object.entries(mockData)) {
        parsedText = parsedText.replace(new RegExp(key, 'g'), value);
    }
    return parsedText;
};

const DEFAULT_TEMPLATE_CONFIG = {
    cover: {
        title: '{建案名稱} 驗屋報告',
        showProjectInfo: true,
        infoFields: [
            { label: '戶別', variable: '{戶別}', enabled: true },
            { label: '產權人', variable: '{產權人姓名}', enabled: true },
            { label: '電話', variable: '{產權人電話}', enabled: true },
            { label: 'Email', variable: '{產權人EMAIL}', enabled: true },
            { label: '驗屋日期', variable: '{驗屋日期}', enabled: true }
        ],
        showDisclaimer: true,
        disclaimer: '☑️ 本人確認已詳閱本次驗屋紀錄，並同意於後續檢驗時，以本報告作為判斷依據。',
        signatureLabel: '產權人簽名：',
        showSignature: true,
        showDate: true,
        dateLabel: '報告產製日期：'
    },
    detail: {
        headerNote: '',
        footerNote: '',
        showInspectorName: true,
        showPhotos: true,
        maxPhotosPerRecord: 4
    },
    email: {
        subject: '【{建案名稱}】您的驗屋報告已產製完成 ({戶別})',
        bodyHtml: '<p>親愛的 {產權人姓名} 您好：</p><p>關於「{建案名稱}」建案 {戶別} 戶別，驗屋報告已產製完成。</p>',
        showDriveButton: true,
        buttonText: '查看驗屋報告',
        footerText: '此為系統自動發送的郵件，請勿直接回覆。'
    },
    emailAttachments: {
        enabled: false,
        files: []
    }
};

const templateConfig = ref(JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_CONFIG)));

const loadSettings = async () => {
    isLoading.value = true;
    try {
        const projectData = await getProjectSettings(props.projectId);
        if (projectData) {
            if (projectData.inspectionPdfTemplate) {
                // Deep merge with defaults to ensure all keys exist
                const savedCover = projectData.inspectionPdfTemplate.cover || {};

                templateConfig.value = {
                    cover: {
                        ...DEFAULT_TEMPLATE_CONFIG.cover,
                        ...savedCover,
                        // 向下相容：如果資料庫中沒有 showDisclaimer 屬性，預設開啟
                        showDisclaimer: savedCover.showDisclaimer !== undefined ? savedCover.showDisclaimer : true
                    },
                    detail: { ...DEFAULT_TEMPLATE_CONFIG.detail, ...projectData.inspectionPdfTemplate.detail },
                    email: { ...DEFAULT_TEMPLATE_CONFIG.email, ...projectData.inspectionPdfTemplate.email },
                    emailAttachments: { ...DEFAULT_TEMPLATE_CONFIG.emailAttachments, ...(projectData.inspectionPdfTemplate.emailAttachments || {}) }
                };
                // Handle nested infoFields carefully
                if (projectData.inspectionPdfTemplate.cover?.infoFields) {
                    templateConfig.value.cover.infoFields = projectData.inspectionPdfTemplate.cover.infoFields;
                }
            }
        }
    } catch (err) {
        showSnackbar('載入模板設定失敗: ' + (err.message || ''), 'error');
    } finally {
        isLoading.value = false;
    }
};

const saveTemplateSettings = async () => {
    isSaving.value = true;
    try {
        const plainConfig = JSON.parse(JSON.stringify(templateConfig.value));
        const res = await updateProjectSettings(props.projectId, {
            inspectionPdfTemplate: plainConfig
        });

        if (res.status === 'success') {
            showSnackbar('驗屋報告模板設定已儲存', 'success');
        } else {
            throw new Error(res.message);
        }
    } catch (error) {
        showSnackbar('儲存失敗: ' + (error.message || ''), 'error');
    } finally {
        isSaving.value = false;
    }
};

onMounted(() => {
    loadSettings();
});
</script>

<style scoped>
.gap-4 {
    gap: 16px;
}

.gap-2 {
    gap: 8px;
}
</style>
