<template>
  <v-dialog :model-value="true" fullscreen persistent transition="dialog-bottom-transition">
    <div ref="rootRef" class="ace" tabindex="-1">
      <header class="ace-head">
        <input v-model="title" class="ace-title" placeholder="頁面名稱" maxlength="60" aria-label="頁面名稱" />
        <button type="button" class="mac-btn" :disabled="saving" @click="requestClose">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!canSave" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" />
          儲存
        </button>
      </header>

      <!-- 主工具列 -->
      <div class="ace-toolbar">
        <button type="button" class="ace-btn ace-btn--label" title="文字方塊" @click="addText">
          <v-icon size="18">mdi-format-text</v-icon><span>文字</span>
        </button>
        <button type="button" class="ace-btn ace-btn--label" title="圖片" @click="pickImages">
          <v-icon size="18">mdi-image-plus-outline</v-icon><span>圖片</span>
        </button>
        <button type="button" class="ace-btn ace-btn--label" title="按鈕" @click="openButtonDialog()">
          <v-icon size="18">mdi-gesture-tap-button</v-icon><span>按鈕</span>
        </button>
        <v-menu v-model="bgMenu" :close-on-content-click="false" location="bottom start" :offset="4">
          <template #activator="{ props: mp }">
            <button type="button" class="ace-btn ace-btn--label" v-bind="mp" title="背景" @click="finishTextEdit">
              <span class="ace-bg-dot" :style="{ background: canvas.background.color }"></span><span>背景</span>
            </button>
          </template>
          <div class="ace-pop">
            <div class="ace-pop-grid">
              <button
                v-for="c in BG_COLORS"
                :key="c"
                type="button"
                class="ace-swatch"
                :class="{ 'ace-swatch--on': canvas.background.color.toLowerCase() === c }"
                :style="{ background: c }"
                @click="setBackgroundColor(c, true)"
              ></button>
              <label class="ace-swatch ace-swatch--custom" title="自訂顏色">
                <v-icon size="14">mdi-eyedropper-variant</v-icon>
                <input
                  type="color"
                  :value="canvas.background.color"
                  @input="setBackgroundColor($event.target.value, false)"
                  @change="commit"
                />
              </label>
            </div>
            <div class="ace-pop-row">
              <button type="button" class="mac-btn" @click="pickBackgroundImage">
                <v-icon size="15">mdi-image-outline</v-icon>{{ canvas.background.image ? '更換背景圖' : '背景圖' }}
              </button>
              <button v-if="canvas.background.image" type="button" class="mac-btn mac-btn--danger" @click="removeBackgroundImage">移除</button>
            </div>
          </div>
        </v-menu>

        <span class="ace-sep"></span>
        <button type="button" class="ace-btn" title="復原" :disabled="!canUndo" @click="undo">
          <v-icon size="17">mdi-undo</v-icon>
        </button>
        <button type="button" class="ace-btn" title="重做" :disabled="!canRedo" @click="redo">
          <v-icon size="17">mdi-redo</v-icon>
        </button>

        <template v-if="selectedItem && !editingId">
          <span class="ace-sep"></span>
          <button v-if="selectedItem.type === 'text'" type="button" class="ace-btn" title="編輯文字" @click="startTextEdit(selectedItem, 'end')">
            <v-icon size="17">mdi-pencil</v-icon>
          </button>
          <button
            type="button"
            class="ace-btn"
            :class="{ 'ace-btn--on': !!selectedItem.link }"
            :title="selectedItem.type === 'button' ? '編輯按鈕' : '連結'"
            @click="openItemLink"
          >
            <v-icon size="17">{{ selectedItem.type === 'button' ? 'mdi-pencil' : 'mdi-link-variant' }}</v-icon>
          </button>
          <button type="button" class="ace-btn" title="複製一份" @click="duplicateSelected">
            <v-icon size="17">mdi-content-copy</v-icon>
          </button>
          <v-menu location="bottom start" :offset="4">
            <template #activator="{ props: mp }">
              <button type="button" class="ace-btn" v-bind="mp" title="圖層">
                <v-icon size="17">mdi-layers-outline</v-icon>
              </button>
            </template>
            <v-list density="compact" class="ace-menu">
              <v-list-item v-for="op in LAYER_OPS" :key="op.value" :prepend-icon="op.icon" :title="op.label" @click="moveLayer(op.value)" />
            </v-list>
          </v-menu>
          <button type="button" class="ace-btn ace-btn--danger" title="刪除" @click="deleteSelected">
            <v-icon size="17">mdi-trash-can-outline</v-icon>
          </button>
        </template>
      </div>

      <!-- 文字格式列：編輯文字方塊時出現 -->
      <div v-if="textEditor" class="ace-toolbar ace-texttools">
        <select class="ace-select" :value="blockType" title="段落樣式" @change="setBlockType($event.target.value)">
          <option value="p">內文</option>
          <option value="h1">大標題</option>
          <option value="h2">小標題</option>
        </select>
        <select class="ace-select" :value="currentFontSize" title="文字大小" @change="setFontSize($event.target.value)">
          <option v-for="o in fontSizeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <span class="ace-sep"></span>
        <button type="button" class="ace-btn" :class="{ 'ace-btn--on': textEditor.isActive('bold') }" title="粗體" @mousedown.prevent @click="runText(c => c.toggleBold())">
          <v-icon size="18">mdi-format-bold</v-icon>
        </button>
        <button type="button" class="ace-btn" :class="{ 'ace-btn--on': textEditor.isActive('italic') }" title="斜體" @mousedown.prevent @click="runText(c => c.toggleItalic())">
          <v-icon size="18">mdi-format-italic</v-icon>
        </button>
        <button type="button" class="ace-btn" :class="{ 'ace-btn--on': textEditor.isActive('underline') }" title="底線" @mousedown.prevent @click="runText(c => c.toggleUnderline())">
          <v-icon size="18">mdi-format-underline</v-icon>
        </button>
        <v-menu v-model="colorMenu" :close-on-content-click="false" location="bottom start" :offset="4">
          <template #activator="{ props: mp }">
            <button type="button" class="ace-btn ace-btn--color" v-bind="mp" title="文字顏色" @mousedown.prevent>
              <v-icon size="18">mdi-format-color-text</v-icon>
              <span class="ace-color-bar" :style="{ background: currentColor || '#1d1d1f' }"></span>
            </button>
          </template>
          <div class="ace-pop">
            <div class="ace-pop-grid">
              <button
                v-for="c in COLORS"
                :key="c"
                type="button"
                class="ace-swatch"
                :class="{ 'ace-swatch--on': (currentColor || '').toLowerCase() === c }"
                :style="{ background: c }"
                @mousedown.prevent
                @click="runText(ch => ch.setColor(c))"
              ></button>
              <label class="ace-swatch ace-swatch--custom" title="自訂顏色">
                <v-icon size="14">mdi-eyedropper-variant</v-icon>
                <input type="color" :value="currentColor || '#1d1d1f'" @input="runText(ch => ch.setColor($event.target.value))" />
              </label>
            </div>
            <button type="button" class="ace-pop-clear" @mousedown.prevent @click="runText(ch => ch.unsetColor()); colorMenu = false">清除顏色</button>
          </div>
        </v-menu>
        <span class="ace-sep"></span>
        <button
          v-for="a in ALIGNS"
          :key="a.value"
          type="button"
          class="ace-btn"
          :class="{ 'ace-btn--on': textEditor.isActive({ textAlign: a.value }) }"
          :title="a.label"
          @mousedown.prevent
          @click="runText(c => c.setTextAlign(a.value))"
        >
          <v-icon size="18">{{ a.icon }}</v-icon>
        </button>
        <button type="button" class="ace-btn" :class="{ 'ace-btn--on': textEditor.isActive('bulletList') }" title="項目清單" @mousedown.prevent @click="runText(c => c.toggleBulletList())">
          <v-icon size="18">mdi-format-list-bulleted</v-icon>
        </button>
        <button type="button" class="ace-btn" :class="{ 'ace-btn--on': textEditor.isActive('orderedList') }" title="編號清單" @mousedown.prevent @click="runText(c => c.toggleOrderedList())">
          <v-icon size="18">mdi-format-list-numbered</v-icon>
        </button>
        <button type="button" class="ace-btn" :class="{ 'ace-btn--on': textEditor.isActive('link') }" title="文字連結" @mousedown.prevent @click="openTextLinkDialog">
          <v-icon size="18">mdi-link-variant</v-icon>
        </button>
        <span class="ace-spacer"></span>
        <button type="button" class="mac-btn" @click="finishTextEdit">完成</button>
      </div>

      <div
        ref="bodyRef"
        class="ace-body"
        @pointerdown.self="clearSelection"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <div ref="sizerRef" class="ace-sizer" :style="sizerStyle" @pointerdown.self="clearSelection">
          <div class="ace-stage ac-canvas" :style="stageStyle" @pointerdown.self="clearSelection">
            <div
              v-for="item in canvas.items"
              :key="item.id"
              :ref="el => setItemEl(item, el)"
              :data-id="item.id"
              class="ac-item"
              :class="[`ac-${item.type}`, { 'is-selected': item.id === selectedId, 'is-editing': item.id === editingId }]"
              :style="itemStyle(item)"
              @pointerdown="onItemPointerDown($event, item)"
              @dblclick="onItemDblClick(item)"
              @contextmenu="onItemContextMenu($event, item)"
            >
              <template v-if="item.type === 'text'">
                <EditorContent v-if="item.id === editingId && textEditor" :editor="textEditor" class="ap-content ac-text-inner" />
                <div v-else class="ap-content ac-text-inner" v-html="textItemHtml(item)"></div>
              </template>
              <img v-else-if="item.type === 'image'" :src="item.src" alt="" draggable="false" />
              <span v-else class="ac-btn-label">{{ item.label }}</span>
              <span v-if="item.link" class="ace-link-badge"><v-icon size="13">mdi-link-variant</v-icon></span>
            </div>
          </div>

          <!-- 參考線與選取框（螢幕座標，不隨畫布縮小，手機上控制點仍好按） -->
          <div class="ace-overlay">
            <div
              v-for="(g, i) in guides"
              :key="i"
              class="ace-guide"
              :class="`ace-guide--${g.type}`"
              :style="g.type === 'v' ? { left: `${g.pos * scale}px` } : { top: `${g.pos * scale}px` }"
            ></div>
            <div v-if="selectedItem && !editingId" class="ace-selection" :style="selectionStyle">
              <div class="ace-rotate-stick"></div>
              <div class="ace-rotate" title="旋轉" @pointerdown.stop.prevent="startRotate"></div>
              <div
                v-for="h in handles"
                :key="`${h.sx}${h.sy}`"
                class="ace-handle"
                :style="{ left: `${(h.sx + 1) * 50}%`, top: `${(h.sy + 1) * 50}%`, cursor: `${h.cursor}-resize` }"
                @pointerdown.stop.prevent="startResize($event, h)"
              ></div>
            </div>
          </div>
        </div>

        <div class="ace-height" :style="{ width: sizerStyle.width }" title="拖曳調整高度" @pointerdown.prevent="startHeightDrag">
          <v-icon size="16">mdi-drag-horizontal-variant</v-icon>
          <span>{{ Math.round(canvas.height) }}</span>
        </div>
      </div>

      <div v-if="upload.total > 0" class="ace-uploading">
        <v-progress-circular indeterminate size="16" width="2" color="white" />
        圖片上傳中 {{ upload.done }}/{{ upload.total }}
      </div>

      <input ref="imageInputRef" type="file" :accept="IMAGE_ACCEPT" multiple hidden @change="onPickImages" />
      <input ref="bgInputRef" type="file" :accept="IMAGE_ACCEPT" hidden @change="onPickBackground" />
    </div>

    <!-- 右鍵／長按選單 -->
    <v-menu v-model="ctxMenu.open" :target="[ctxMenu.x, ctxMenu.y]" location="bottom start" :offset="2">
      <v-list v-if="selectedItem" density="compact" class="ace-menu">
        <v-list-item v-for="op in LAYER_OPS" :key="op.value" :prepend-icon="op.icon" :title="op.label" @click="moveLayer(op.value)" />
        <v-divider />
        <v-list-item v-for="a in ALIGNS" :key="a.value" :prepend-icon="a.icon" :title="a.label" @click="alignSelected(a.value)" />
        <v-divider />
        <v-list-item v-if="selectedItem.type === 'text'" prepend-icon="mdi-pencil" title="編輯文字" @click="startTextEdit(selectedItem, 'end')" />
        <v-list-item v-if="selectedItem.type === 'button'" prepend-icon="mdi-pencil" title="編輯按鈕" @click="openButtonDialog(selectedItem)" />
        <v-list-item v-else prepend-icon="mdi-link-variant" :title="selectedItem.link ? '編輯連結' : '設定連結'" @click="openItemLink" />
        <v-list-item prepend-icon="mdi-content-copy" title="複製一份" @click="duplicateSelected" />
        <v-list-item prepend-icon="mdi-trash-can-outline" title="刪除" class="ace-menu-danger" @click="deleteSelected" />
      </v-list>
    </v-menu>

    <!-- 連結（物件連結／文字方塊內選字連結） -->
    <v-dialog v-model="linkDialog.open" max-width="420" content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-link-variant</v-icon>
          <span>{{ linkDialog.editing ? '編輯連結' : '設定連結' }}</span>
        </div>
        <div class="mac-sheet-section">
          <template v-if="linkDialog.needText">
            <div class="mac-sheet-label">顯示文字</div>
            <v-text-field v-model="linkDialog.text" variant="solo" flat density="compact" class="mac-vfield mb-3" hide-details />
          </template>
          <div class="mac-sheet-label">網址</div>
          <v-text-field
            v-model="linkDialog.url"
            variant="solo"
            flat
            density="compact"
            class="mac-vfield"
            placeholder="https://"
            hide-details
            autofocus
            @keydown.enter.prevent="applyLink"
          />
        </div>
        <div class="mac-sheet-foot">
          <button v-if="linkDialog.editing" type="button" class="mac-btn mac-btn--danger" @click="removeLink">移除連結</button>
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" @click="linkDialog.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="!linkDialog.url.trim()" @click="applyLink">確定</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 按鈕 -->
    <v-dialog v-model="buttonDialog.open" max-width="440" content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-gesture-tap-button</v-icon>
          <span>{{ buttonDialog.editId ? '編輯按鈕' : '插入按鈕' }}</span>
        </div>
        <div class="mac-sheet-section">
          <div class="mac-sheet-label">按鈕文字</div>
          <v-text-field v-model="buttonDialog.label" variant="solo" flat density="compact" class="mac-vfield mb-3" maxlength="30" hide-details autofocus />
          <div class="mac-sheet-label">網址</div>
          <v-text-field
            v-model="buttonDialog.url"
            variant="solo"
            flat
            density="compact"
            class="mac-vfield mb-3"
            placeholder="https://"
            hide-details
            @keydown.enter.prevent="applyButton"
          />
          <div class="mac-sheet-label">顏色</div>
          <div class="ace-btn-colors">
            <button
              v-for="c in COLORS"
              :key="c"
              type="button"
              class="ace-swatch"
              :class="{ 'ace-swatch--on': buttonDialog.color.toLowerCase() === c }"
              :style="{ background: c }"
              @click="buttonDialog.color = c"
            ></button>
            <label class="ace-swatch ace-swatch--custom" title="自訂顏色">
              <v-icon size="14">mdi-eyedropper-variant</v-icon>
              <input type="color" :value="buttonDialog.color" @input="buttonDialog.color = $event.target.value" />
            </label>
          </div>
          <div class="mac-sheet-label mt-3">文字大小</div>
          <div class="mac-form-seg">
            <button
              v-for="o in BUTTON_SIZES"
              :key="o.value"
              type="button"
              class="mac-form-seg-btn"
              :class="{ 'is-active': buttonDialog.fontSize === o.value }"
              @click="buttonDialog.fontSize = o.value"
            >{{ o.label }}</button>
          </div>
          <div v-if="buttonDialog.label.trim()" class="ace-btn-preview">
            <span class="ac-button ace-btn-sample" :style="{ backgroundColor: buttonDialog.color, color: readableTextColor(buttonDialog.color), fontSize: `${buttonDialog.fontSize}px` }">
              {{ buttonDialog.label.trim() }}
            </span>
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" @click="buttonDialog.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="!buttonDialog.label.trim()" @click="applyButton">確定</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 放棄變更 -->
    <v-dialog v-model="discardDialog" max-width="360" content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-section">放棄未儲存的內容？</div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" @click="discardDialog = false">繼續編輯</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" @click="discard">放棄</button>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
/**
 * 活動訊息「自建頁面」自由畫布編輯器
 * - 物件：文字方塊（tiptap 編輯）、圖片、按鈕；皆可拖曳、縮放、旋轉、設連結
 * - 圖片拖角落等比縮放、拖邊緣變形（按住 Shift 拖角落也可變形）；文字方塊只調寬度、高度隨內容
 * - 右鍵／長按選單：圖層前後、對齊畫布、編輯、連結、複製、刪除
 * - 拖曳吸附畫布與其他物件的邊緣／中線（按住 Option/Alt 暫停吸附）；⌘/Ctrl+Z 復原、⌘/Ctrl+Shift+Z 重做
 * - 圖片自動壓到 2MB 內後上傳；儲存後清掉不再使用的圖片
 */
import { ref, reactive, computed, shallowRef, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import { serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '@/store/user';
import {
  uploadActivityMessage,
  addActivityMessageMetadata,
  updateActivityMessagePage,
  deleteActivityMessageAssets,
} from '@/api';
import { normalizeActivityLink } from '@/utils/activityPage';
import { shrinkImageToLimit } from '@/utils/canvasCompress';
import {
  CANVAS_WIDTH,
  CANVAS_MIN_HEIGHT,
  CANVAS_MAX_HEIGHT,
  DEFAULT_BUTTON_COLOR,
  createCanvas,
  normalizeCanvas,
  newItemId,
  canvasStyle,
  itemStyle,
  textItemHtml,
  canvasAssets,
  readableTextColor,
  resizeBox,
  boundingSize,
  snapMove,
} from '@/utils/activityCanvas';
import '@/styles/activityPageContent.css';

const props = defineProps({
  projectId: { type: String, required: true },
  // 要編輯的頁面；null 為新建
  page: { type: Object, default: null },
});
const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const userStore = useUserStore();

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
const COLORS = ['#1d1d1f', '#8e8e93', '#ffffff', '#ff3b30', '#ff9500', '#d4a800', '#34c759', '#00a3a3', '#0071e3', '#5856d6', '#af52de', '#ff2d55', '#a2845e'];
const BG_COLORS = ['#ffffff', '#f5f5f7', '#fff8e7', '#fdecef', '#e8f4ff', '#eaf7ee', '#1d1d1f', '#0b2545', '#7a1f1f', '#2f3e2e'];
const ALIGNS = [
  { value: 'left', label: '靠左', icon: 'mdi-format-align-left' },
  { value: 'center', label: '置中', icon: 'mdi-format-align-center' },
  { value: 'right', label: '靠右', icon: 'mdi-format-align-right' },
];
const LAYER_OPS = [
  { value: 'top', label: '移到最上層', icon: 'mdi-arrange-bring-to-front' },
  { value: 'up', label: '上移一層', icon: 'mdi-arrange-bring-forward' },
  { value: 'down', label: '下移一層', icon: 'mdi-arrange-send-backward' },
  { value: 'bottom', label: '移到最下層', icon: 'mdi-arrange-send-to-back' },
];
const FONT_SIZES = ['', '12px', '14px', '18px', '20px', '24px', '28px', '32px', '40px', '48px', '60px', '72px'];
const BUTTON_SIZES = [
  { value: 14, label: '小' },
  { value: 16, label: '中' },
  { value: 20, label: '大' },
  { value: 26, label: '特大' },
];
const ALL_HANDLES = [
  { sx: -1, sy: -1, cursor: 'nwse' }, { sx: 0, sy: -1, cursor: 'ns' }, { sx: 1, sy: -1, cursor: 'nesw' },
  { sx: 1, sy: 0, cursor: 'ew' }, { sx: 1, sy: 1, cursor: 'nwse' }, { sx: 0, sy: 1, cursor: 'ns' },
  { sx: -1, sy: 1, cursor: 'nesw' }, { sx: -1, sy: 0, cursor: 'ew' },
];

const rootRef = ref(null);
const bodyRef = ref(null);
const sizerRef = ref(null);
const imageInputRef = ref(null);
const bgInputRef = ref(null);

const initialTitle = props.page?.title || '';
const title = ref(initialTitle);
const canvas = reactive(props.page?.canvas ? normalizeCanvas(props.page.canvas) : createCanvas());
const saving = ref(false);
const selectedId = ref(null);
const editingId = ref(null);
const textEditor = shallowRef(null);
const guides = ref([]);
const upload = reactive({ total: 0, done: 0 });
const bgMenu = ref(false);
const colorMenu = ref(false);
const discardDialog = ref(false);
const ctxMenu = reactive({ open: false, x: 0, y: 0 });

// 開啟時頁面已引用的圖片；本次編輯上傳的圖片
const originalPaths = [...(props.page?.imagePaths || [])];
const sessionUploaded = new Set();

const findItem = id => canvas.items.find(it => it.id === id) || null;
const selectedItem = computed(() => findItem(selectedId.value));

// ---------- 縮放（畫布寬 800，依可視寬度等比縮小） ----------
const bodyWidth = ref(0);
const scale = computed(() => {
  const pad = bodyWidth.value < 600 ? 16 : 48;
  return bodyWidth.value > 0 ? Math.min(1, (bodyWidth.value - pad) / CANVAS_WIDTH) : 1;
});
const sizerStyle = computed(() => ({
  width: `${Math.round(CANVAS_WIDTH * scale.value)}px`,
  height: `${Math.round(canvas.height * scale.value)}px`,
}));
const stageStyle = computed(() => ({ ...canvasStyle(canvas), transform: `scale(${scale.value})` }));

const selectionStyle = computed(() => {
  const it = selectedItem.value;
  if (!it) return {};
  const s = scale.value;
  return {
    left: `${it.x * s}px`,
    top: `${it.y * s}px`,
    width: `${it.w * s}px`,
    height: `${it.h * s}px`,
    transform: it.rotation ? `rotate(${it.rotation}deg)` : undefined,
  };
});
const handles = computed(() => (selectedItem.value?.type === 'text' ? ALL_HANDLES.filter(h => h.sy === 0) : ALL_HANDLES));

let bodyObserver = null;
// 文字方塊高度隨內容變動，量測後回寫（選取框、吸附、對齊用）
const itemEls = new Map();
const textObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const it = findItem(entry.target.dataset.id);
    if (it?.type !== 'text') return;
    const h = entry.target.offsetHeight;
    if (h && Math.abs(h - it.h) >= 1) it.h = h;
  });
});
function setItemEl(item, el) {
  const prev = itemEls.get(item.id);
  if (prev === el) return;
  if (prev) textObserver.unobserve(prev);
  if (el) {
    itemEls.set(item.id, el);
    if (item.type === 'text') textObserver.observe(el);
  } else {
    itemEls.delete(item.id);
  }
}

onMounted(() => {
  bodyObserver = new ResizeObserver(() => { bodyWidth.value = bodyRef.value?.clientWidth || 0; });
  if (bodyRef.value) bodyObserver.observe(bodyRef.value);
  commit();
  // 快捷鍵掛在 window：右鍵選單、對話框關閉後焦點不一定回到編輯器
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('paste', onPaste);
  nextTick(() => rootRef.value?.focus({ preventScroll: true }));
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('paste', onPaste);
  bodyObserver?.disconnect();
  textObserver.disconnect();
  endGestureListeners();
  textEditor.value?.destroy();
});

// ---------- 復原／重做 ----------
const history = [];
let historyIndex = -1;
const historyTick = ref(0);
function snapshot() {
  return JSON.stringify({ height: canvas.height, background: canvas.background, items: canvas.items });
}
function commit() {
  const snap = snapshot();
  if (history[historyIndex] === snap) return;
  history.splice(historyIndex + 1);
  history.push(snap);
  if (history.length > 100) history.shift();
  historyIndex = history.length - 1;
  historyTick.value += 1;
}
function restore(snap) {
  const data = JSON.parse(snap);
  canvas.height = data.height;
  canvas.background = data.background;
  canvas.items = data.items;
  if (!findItem(selectedId.value)) selectedId.value = null;
  historyTick.value += 1;
}
const canUndo = computed(() => historyTick.value > 0 && historyIndex > 0);
const canRedo = computed(() => historyTick.value > 0 && historyIndex < history.length - 1);
function undo() {
  finishTextEdit();
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restore(history[historyIndex]);
}
function redo() {
  finishTextEdit();
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restore(history[historyIndex]);
}

// ---------- 選取／拖曳／縮放／旋轉 ----------
let gesture = null;

function endGestureListeners() {
  window.removeEventListener('pointermove', onGestureMove);
  window.removeEventListener('pointerup', onGestureEnd);
  window.removeEventListener('pointercancel', onGestureEnd);
}
function beginGesture(e, data) {
  gesture = { startX: e.clientX, startY: e.clientY, moved: false, touch: e.pointerType !== 'mouse', ...data };
  window.addEventListener('pointermove', onGestureMove);
  window.addEventListener('pointerup', onGestureEnd);
  window.addEventListener('pointercancel', onGestureEnd);
}
function cancelGesture() {
  if (gesture) clearTimeout(gesture.timer);
  gesture = null;
  guides.value = [];
  endGestureListeners();
}

function clearSelection() {
  finishTextEdit();
  selectedId.value = null;
}

function onItemPointerDown(e, item) {
  if (item.id === editingId.value) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  finishTextEdit();
  const wasSelected = selectedId.value === item.id;
  selectedId.value = item.id;
  rootRef.value?.focus({ preventScroll: true });
  beginGesture(e, { kind: 'move', id: item.id, start: { x: item.x, y: item.y }, wasSelected });
  // 觸控長按叫出選單（手指還沒放開就出現）
  if (e.pointerType === 'touch') {
    gesture.timer = setTimeout(() => {
      if (!gesture || gesture.moved) return;
      gesture.longPress = true;
      openContextMenu(gesture.startX, gesture.startY);
    }, 550);
  }
}

// 長按放開後瀏覽器會補送一次 mousedown／click，會被選單當成「點外面」而關閉，攔掉這一次
function swallowCompatClick() {
  const stop = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    if (ev.type === 'click') release();
  };
  const release = () => {
    window.removeEventListener('mousedown', stop, true);
    window.removeEventListener('click', stop, true);
  };
  window.addEventListener('mousedown', stop, true);
  window.addEventListener('click', stop, true);
  setTimeout(release, 400);
}

function startResize(e, handle) {
  const it = selectedItem.value;
  if (!it) return;
  beginGesture(e, { kind: 'resize', id: it.id, handle, start: { x: it.x, y: it.y, w: it.w, h: it.h, rotation: it.rotation } });
}

function startRotate(e) {
  const it = selectedItem.value;
  const rect = sizerRef.value?.getBoundingClientRect();
  if (!it || !rect) return;
  const s = scale.value;
  beginGesture(e, { kind: 'rotate', id: it.id, cx: rect.left + (it.x + it.w / 2) * s, cy: rect.top + (it.y + it.h / 2) * s });
}

function startHeightDrag(e) {
  finishTextEdit();
  beginGesture(e, { kind: 'height', start: canvas.height });
}

function onGestureMove(e) {
  if (!gesture || gesture.longPress) return;
  if (!gesture.moved) {
    const dist = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);
    if (dist < (gesture.touch ? 8 : 3)) return;
    gesture.moved = true;
    clearTimeout(gesture.timer);
  }
  const s = scale.value;
  const dx = (e.clientX - gesture.startX) / s;
  const dy = (e.clientY - gesture.startY) / s;

  if (gesture.kind === 'height') {
    canvas.height = Math.round(Math.min(CANVAS_MAX_HEIGHT, Math.max(CANVAS_MIN_HEIGHT, gesture.start + dy)));
    return;
  }
  const it = findItem(gesture.id);
  if (!it) return;

  if (gesture.kind === 'move') {
    let x = gesture.start.x + dx;
    let y = gesture.start.y + dy;
    if (e.altKey) {
      guides.value = [];
    } else {
      const others = canvas.items.filter(o => o.id !== it.id && !o.rotation);
      // 旋轉過的物件外框不是正矩形，只用中心點吸附
      const probe = it.rotation
        ? { x: x + it.w / 2, y: y + it.h / 2, w: 0, h: 0 }
        : { x, y, w: it.w, h: it.h };
      const snapped = snapMove(probe, others, canvas.height, 6 / s);
      x += snapped.x - probe.x;
      y += snapped.y - probe.y;
      guides.value = snapped.guides;
    }
    it.x = Math.round(x);
    it.y = Math.round(y);
  } else if (gesture.kind === 'resize') {
    const next = resizeBox(gesture.start, gesture.handle, dx, dy, it.type === 'image' && !e.shiftKey);
    it.x = next.x;
    it.y = next.y;
    it.w = next.w;
    if (it.type !== 'text') it.h = next.h;
  } else if (gesture.kind === 'rotate') {
    let angle = (Math.atan2(e.clientY - gesture.cy, e.clientX - gesture.cx) * 180) / Math.PI + 90;
    if (e.shiftKey) {
      angle = Math.round(angle / 15) * 15;
    } else {
      const near = Math.round(angle / 90) * 90;
      if (Math.abs(angle - near) < 4) angle = near;
    }
    angle = ((((angle + 180) % 360) + 360) % 360) - 180;
    it.rotation = Math.round(angle);
  }
}

function onGestureEnd() {
  if (!gesture) return;
  const g = gesture;
  cancelGesture();
  if (g.longPress) {
    swallowCompatClick();
    return;
  }
  if (g.moved) {
    commit();
    return;
  }
  // 再點一次已選取的文字方塊 → 進入編輯（觸控沒有雙擊也能編輯）
  if (g.kind === 'move' && g.wasSelected) {
    const it = findItem(g.id);
    if (it?.type === 'text') startTextEdit(it, 'end');
  }
}

function onItemDblClick(item) {
  if (item.type === 'button') openButtonDialog(item);
}

// ---------- 右鍵／長按選單 ----------
function openContextMenu(x, y) {
  ctxMenu.x = x;
  ctxMenu.y = y;
  ctxMenu.open = true;
}
function onItemContextMenu(e, item) {
  if (item.id === editingId.value) return;
  e.preventDefault();
  if (gesture?.longPress) return;
  cancelGesture();
  finishTextEdit();
  selectedId.value = item.id;
  openContextMenu(e.clientX, e.clientY);
}

function moveLayer(op) {
  const it = selectedItem.value;
  if (!it) return;
  const items = canvas.items;
  const from = items.indexOf(it);
  items.splice(from, 1);
  let to = from;
  if (op === 'top') to = items.length;
  else if (op === 'up') to = Math.min(items.length, from + 1);
  else if (op === 'down') to = Math.max(0, from - 1);
  else if (op === 'bottom') to = 0;
  items.splice(to, 0, it);
  commit();
}

// 依旋轉後的外框對齊畫布左／中／右
function alignSelected(where) {
  const it = selectedItem.value;
  if (!it) return;
  const bw = boundingSize(it).w;
  const cx = where === 'left' ? bw / 2 : where === 'right' ? CANVAS_WIDTH - bw / 2 : CANVAS_WIDTH / 2;
  it.x = Math.round(cx - it.w / 2);
  commit();
}

function duplicateSelected() {
  const it = selectedItem.value;
  if (!it) return;
  const copy = { ...JSON.parse(JSON.stringify(it)), id: newItemId(), x: it.x + 20, y: it.y + 20 };
  canvas.items.push(copy);
  selectedId.value = copy.id;
  commit();
}

function deleteSelected() {
  const it = selectedItem.value;
  if (!it) return;
  if (it.id === editingId.value) finishTextEdit();
  canvas.items.splice(canvas.items.indexOf(it), 1);
  selectedId.value = null;
  commit();
}

// ---------- 新增物件 ----------
// 目前可視範圍中心（畫布座標），新物件放在這裡
function visibleAnchor() {
  const body = bodyRef.value;
  const sizer = sizerRef.value;
  if (!body || !sizer) return { x: CANVAS_WIDTH / 2, y: 200 };
  const s = scale.value;
  const rect = sizer.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  const y = (bodyRect.top + body.clientHeight / 2 - rect.top) / s;
  return { x: CANVAS_WIDTH / 2, y: Math.min(Math.max(y, 80), canvas.height - 80) };
}

function addText() {
  finishTextEdit();
  const { x, y } = visibleAnchor();
  const id = newItemId();
  canvas.items.push({ id, type: 'text', x: Math.round(x - 160), y: Math.round(y - 20), w: 320, h: 40, rotation: 0, link: '', html: '<p>輸入文字</p>' });
  selectedId.value = id;
  commit();
  nextTick(() => startTextEdit(findItem(id), 'all'));
}

function pickImages() {
  finishTextEdit();
  imageInputRef.value?.click();
}
function pickBackgroundImage() {
  bgMenu.value = false;
  bgInputRef.value?.click();
}

function imageFilesFrom(dataTransfer) {
  return [...(dataTransfer?.files || [])].filter(f => /^image\//.test(f.type) || /\.hei[cf]$/i.test(f.name || ''));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readImageSize(file) {
  try {
    const bmp = await createImageBitmap(file);
    const size = { w: bmp.width, h: bmp.height };
    bmp.close?.();
    return size;
  } catch (e) {
    return { w: 400, h: 300 };
  }
}

async function uploadImageFile(file) {
  const prepared = await shrinkImageToLimit(file, MAX_IMAGE_BYTES);
  const size = await readImageSize(prepared);
  const { downloadURL, storagePath } = await uploadActivityMessage({
    projectId: props.projectId,
    userKey: userStore.user?.key,
    fileName: prepared.name,
    fileBase64: await fileToBase64(prepared),
    contentType: prepared.type,
  });
  sessionUploaded.add(storagePath);
  return { src: downloadURL, path: storagePath, size };
}

async function withUploadProgress(files, handler) {
  upload.total += files.length;
  for (const file of files) {
    try {
      await handler(file);
    } catch (err) {
      toast.error(`${file.name}：${err.message}`);
    } finally {
      upload.done += 1;
    }
  }
  if (upload.done >= upload.total) {
    upload.total = 0;
    upload.done = 0;
  }
}

function addImages(files, at = null) {
  let offset = 0;
  return withUploadProgress(files, async (file) => {
    const { src, path, size } = await uploadImageFile(file);
    const anchor = at || visibleAnchor();
    const w = Math.min(420, size.w);
    const h = Math.max(20, Math.round((w * size.h) / size.w));
    const id = newItemId();
    canvas.items.push({ id, type: 'image', x: Math.round(anchor.x - w / 2 + offset), y: Math.round(anchor.y - h / 2 + offset), w, h, rotation: 0, link: '', src, path });
    selectedId.value = id;
    offset += 24;
    commit();
  });
}

function onPickImages(e) {
  const files = [...(e.target.files || [])];
  e.target.value = '';
  if (files.length) addImages(files);
}

function onPickBackground(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  withUploadProgress([file], async (f) => {
    const { src, path } = await uploadImageFile(f);
    canvas.background.image = src;
    canvas.background.imagePath = path;
    commit();
  });
}

function removeBackgroundImage() {
  canvas.background.image = '';
  canvas.background.imagePath = '';
  commit();
}

function setBackgroundColor(color, save) {
  canvas.background.color = color;
  if (save) commit();
}

function onDrop(e) {
  const files = imageFilesFrom(e.dataTransfer);
  if (!files.length) return;
  const rect = sizerRef.value?.getBoundingClientRect();
  const s = scale.value;
  const at = rect ? { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s } : null;
  addImages(files, at);
}

function onPaste(e) {
  if (editingId.value || linkDialog.open || buttonDialog.open) return;
  if (e.target.closest?.('input, textarea')) return;
  const files = imageFilesFrom(e.clipboardData);
  if (!files.length) return;
  e.preventDefault();
  addImages(files);
}

// ---------- 文字方塊編輯 ----------
function startTextEdit(item, focus = 'end') {
  if (!item) return;
  finishTextEdit();
  selectedId.value = item.id;
  editingId.value = item.id;
  textEditor.value = new Editor({
    content: item.html,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: 'https' },
      }),
      TextStyle,
      Color,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    autofocus: focus,
  });
}

function finishTextEdit() {
  const ed = textEditor.value;
  if (!ed) return;
  const it = findItem(editingId.value);
  const html = ed.getHTML();
  const empty = !ed.state.doc.textContent.trim();
  ed.destroy();
  textEditor.value = null;
  editingId.value = null;
  colorMenu.value = false;
  if (!it) return;
  if (empty) {
    canvas.items.splice(canvas.items.indexOf(it), 1);
    if (selectedId.value === it.id) selectedId.value = null;
    commit();
  } else if (html !== it.html) {
    it.html = html;
    commit();
  }
  rootRef.value?.focus({ preventScroll: true });
}

function runText(fn) {
  if (!textEditor.value) return;
  fn(textEditor.value.chain().focus()).run();
}

const blockType = computed(() => {
  const ed = textEditor.value;
  if (!ed) return 'p';
  if (ed.isActive('heading', { level: 1 })) return 'h1';
  if (ed.isActive('heading', { level: 2 })) return 'h2';
  return 'p';
});
function setBlockType(value) {
  if (value === 'h1') runText(c => c.setHeading({ level: 1 }));
  else if (value === 'h2') runText(c => c.setHeading({ level: 2 }));
  else runText(c => c.setParagraph());
}

const textStyleAttrs = computed(() => (textEditor.value ? textEditor.value.getAttributes('textStyle') : {}));
const currentColor = computed(() => textStyleAttrs.value.color || '');
const currentFontSize = computed(() => textStyleAttrs.value.fontSize || '');
const fontSizeOptions = computed(() => {
  const options = FONT_SIZES.map(v => ({ value: v, label: v ? v.replace('px', '') : '字級' }));
  const cur = currentFontSize.value;
  if (cur && !FONT_SIZES.includes(cur)) options.push({ value: cur, label: cur.replace('px', '') });
  return options;
});
function setFontSize(size) {
  if (size) runText(c => c.setFontSize(size));
  else runText(c => c.unsetFontSize());
}

// ---------- 連結 ----------
const linkDialog = reactive({ open: false, mode: 'item', url: '', text: '', needText: false, editing: false });

function openItemLink() {
  const it = selectedItem.value;
  if (!it) return;
  if (it.type === 'button') {
    openButtonDialog(it);
    return;
  }
  finishTextEdit();
  Object.assign(linkDialog, { open: true, mode: 'item', url: it.link || '', text: '', needText: false, editing: !!it.link });
}

function openTextLinkDialog() {
  const ed = textEditor.value;
  if (!ed) return;
  const editing = ed.isActive('link');
  if (editing) ed.chain().extendMarkRange('link').run();
  Object.assign(linkDialog, {
    open: true,
    mode: 'text',
    url: editing ? ed.getAttributes('link').href || '' : '',
    text: '',
    needText: !editing && ed.state.selection.empty,
    editing,
  });
}

function applyLink() {
  const href = normalizeActivityLink(linkDialog.url);
  if (!href) return;
  if (linkDialog.mode === 'item') {
    const it = selectedItem.value;
    if (it) {
      it.link = href;
      commit();
    }
  } else if (linkDialog.needText) {
    const text = linkDialog.text.trim() || linkDialog.url.trim();
    runText(c => c.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] }).unsetMark('link'));
  } else {
    runText(c => c.extendMarkRange('link').setLink({ href }));
  }
  linkDialog.open = false;
}

function removeLink() {
  if (linkDialog.mode === 'item') {
    const it = selectedItem.value;
    if (it) {
      it.link = '';
      commit();
    }
  } else {
    runText(c => c.extendMarkRange('link').unsetLink());
  }
  linkDialog.open = false;
}

// ---------- 按鈕 ----------
const buttonDialog = reactive({ open: false, editId: '', label: '', url: '', color: DEFAULT_BUTTON_COLOR, fontSize: 16 });

function openButtonDialog(item = null) {
  finishTextEdit();
  Object.assign(buttonDialog, {
    open: true,
    editId: item?.id || '',
    label: item?.label || '立即預約',
    url: item?.link || '',
    color: item?.color || DEFAULT_BUTTON_COLOR,
    fontSize: item?.fontSize || 16,
  });
}

function applyButton() {
  const label = buttonDialog.label.trim();
  if (!label) return;
  const data = { label, link: normalizeActivityLink(buttonDialog.url), color: buttonDialog.color, fontSize: buttonDialog.fontSize };
  const existing = findItem(buttonDialog.editId);
  if (existing) {
    Object.assign(existing, data);
  } else {
    const { x, y } = visibleAnchor();
    const w = Math.round(Math.min(560, Math.max(140, label.length * data.fontSize + 64)));
    const h = Math.round(data.fontSize * 3);
    const id = newItemId();
    canvas.items.push({ id, type: 'button', x: Math.round(x - w / 2), y: Math.round(y - h / 2), w, h, rotation: 0, ...data });
    selectedId.value = id;
  }
  commit();
  buttonDialog.open = false;
}

// ---------- 鍵盤 ----------
function onKeydown(e) {
  // 選單或對話框開著時交給它們處理
  if (ctxMenu.open || linkDialog.open || buttonDialog.open || discardDialog.value || bgMenu.value || colorMenu.value) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    save();
    return;
  }
  if (editingId.value) {
    if (e.key === 'Escape') {
      e.preventDefault();
      finishTextEdit();
    }
    return;
  }
  if (e.target.closest?.('input, textarea, select')) return;
  if (mod && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (mod && (e.key === 'y' || e.key === 'Y')) {
    e.preventDefault();
    redo();
    return;
  }
  const it = selectedItem.value;
  if (!it) return;
  if (mod && (e.key === 'd' || e.key === 'D')) {
    e.preventDefault();
    duplicateSelected();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    deleteSelected();
  } else if (e.key === 'Escape') {
    selectedId.value = null;
  } else if (e.key === 'Enter' && it.type === 'text') {
    e.preventDefault();
    startTextEdit(it, 'end');
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') it.x -= step;
    else if (e.key === 'ArrowRight') it.x += step;
    else if (e.key === 'ArrowUp') it.y -= step;
    else it.y += step;
    commit();
  }
}

// ---------- 儲存／關閉 ----------
const canSave = computed(() => !!title.value.trim() && !saving.value && upload.total === 0);

function cleanupAssets(paths) {
  if (!paths.length) return;
  deleteActivityMessageAssets({
    projectId: props.projectId,
    userKey: userStore.user?.key,
    storagePaths: paths,
  }).catch(err => console.warn('清除活動訊息頁面圖片失敗：', err));
}

async function save() {
  finishTextEdit();
  if (!canSave.value) return;
  if (!canvas.items.length && !canvas.background.image) {
    toast.warning('畫布是空的');
    return;
  }
  saving.value = true;
  try {
    const data = normalizeCanvas(JSON.parse(JSON.stringify(canvas)));
    const { imagePaths, coverURL } = canvasAssets(data);
    const name = title.value.trim();
    const payload = {
      title: name,
      fileName: name,
      layout: 'canvas',
      canvas: data,
      imagePaths,
      coverURL,
      updatedBy: userStore.user?.key || '',
      updatedByName: userStore.user?.name || '',
    };
    let id = props.page?.id;
    if (id) {
      await updateActivityMessagePage(id, payload);
    } else {
      id = await addActivityMessageMetadata({
        projectId: props.projectId,
        type: 'page',
        ...payload,
        sortOrder: Date.now(),
        uploadedBy: userStore.user?.key || '',
        uploadedByName: userStore.user?.name || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    cleanupAssets([...new Set([...originalPaths, ...sessionUploaded])].filter(p => !imagePaths.includes(p)));
    sessionUploaded.clear();
    toast.success('已儲存', { timeout: 1500 });
    emit('saved', id);
    emit('close');
  } catch (err) {
    toast.error(`儲存失敗：${err.message}`);
  } finally {
    saving.value = false;
  }
}

// 文字方塊高度是量測值，比對變更時排除
function comparable() {
  return JSON.stringify({
    height: canvas.height,
    background: canvas.background,
    items: canvas.items.map(it => (it.type === 'text' ? { ...it, h: 0 } : it)),
  });
}
const initialComparable = comparable();

function isDirty() {
  if (title.value !== initialTitle || sessionUploaded.size > 0 || textEditor.value) return true;
  return comparable() !== initialComparable;
}

function requestClose() {
  if (saving.value) return;
  if (textEditor.value) finishTextEdit();
  if (isDirty() || upload.total > 0) discardDialog.value = true;
  else emit('close');
}

function discard() {
  cleanupAssets([...sessionUploaded]);
  sessionUploaded.clear();
  discardDialog.value = false;
  emit('close');
}
</script>

<style scoped>
.ace {
  --f: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --blue: #0071e3;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #e5e5ea;
  font-family: var(--f);
  color: #1d1d1f;
  outline: none;
}

/* 標題列：左側留給全站漢堡鈕 */
.ace-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 8px 12px 8px 58px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.ace-title {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 7px;
  background: #fff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  outline: none;
}
.ace-title:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.22); }
.ace-title::placeholder { font-weight: 400; color: #8e8e93; }

.ace-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 5px 10px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.ace-texttools { background: #f5f8ff; }
.ace-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 32px;
  height: 30px;
  padding: 0 5px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #3a3a3c;
  font-family: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}
.ace-btn:hover:not(:disabled) { background: rgba(0, 0, 0, 0.07); }
.ace-btn:disabled { opacity: 0.35; cursor: default; }
.ace-btn--label { padding: 0 9px; }
.ace-btn--on { background: #fff; color: var(--blue); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.08); }
.ace-btn--on .v-icon { color: var(--blue); }
.ace-btn--danger .v-icon { color: #d62d20; }
.ace-btn--color { width: 32px; }
.ace-color-bar { position: absolute; left: 7px; right: 7px; bottom: 3px; height: 3px; border-radius: 2px; }
.ace-bg-dot { width: 16px; height: 16px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2); }
.ace-sep { width: 1px; height: 18px; margin: 0 4px; background: rgba(0, 0, 0, 0.12); flex-shrink: 0; }
.ace-spacer { flex: 1; }
.ace-select {
  height: 30px;
  padding: 0 24px 0 9px;
  margin-right: 4px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 6px;
  background: #fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%233a3a3c' stroke-width='1.5' stroke-linecap='round'/></svg>") no-repeat right 8px center;
  font-family: inherit;
  font-size: 13px;
  color: #1d1d1f;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

/* 彈出面板（v-menu 內容掛在 body，變數需重新宣告） */
.ace-pop {
  --blue: #0071e3;
  padding: 10px;
  border-radius: 10px;
  background: #f5f5f7;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
}
.ace-pop-grid { display: grid; grid-template-columns: repeat(7, 26px); gap: 6px; }
.ace-pop-row { display: flex; gap: 6px; margin-top: 10px; }
.ace-pop-clear {
  width: 100%;
  height: 26px;
  margin-top: 8px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #3a3a3c;
  cursor: pointer;
}
.ace-swatch {
  --blue: #0071e3;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
}
.ace-swatch--on { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14), 0 0 0 2px #fff, 0 0 0 3.5px var(--blue); }
.ace-swatch--custom { overflow: hidden; color: #fff; background: conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #0a84ff, #af52de, #ff3b30); }
.ace-swatch--custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.ace-btn-colors { display: flex; flex-wrap: wrap; gap: 6px; }
.ace-btn-preview { display: flex; justify-content: center; margin-top: 16px; }
.ace-btn-sample { position: static; min-height: 44px; padding: 0 26px; }
.ace-menu { min-width: 170px; }
.ace-menu :deep(.v-list-item-title) { font-size: 13px; }
.ace-menu-danger { color: #d62d20; }

/* 畫布區 */
.ace-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px 24px 80px;
  -webkit-overflow-scrolling: touch;
}
.ace-sizer {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 10px 32px rgba(0, 0, 0, 0.12);
}
.ace-stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.ace-stage .ac-item { cursor: move; touch-action: none; }
.ace-stage .ac-item:hover:not(.is-selected) { outline: 1px dashed rgba(0, 113, 227, 0.55); }
.ace-stage .ac-item.is-editing { cursor: text; outline: 1.5px dashed var(--blue); user-select: text; -webkit-user-select: text; }
.ace-stage :deep(.ac-text-inner .ProseMirror) { outline: none; min-height: 1em; }
.ace-link-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--blue);
  color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
.ace-link-badge .v-icon { color: #fff; }

.ace-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ace-guide { position: absolute; background: #ff2d55; }
.ace-guide--v { top: 0; bottom: 0; width: 1px; }
.ace-guide--h { left: 0; right: 0; height: 1px; }
.ace-selection {
  position: absolute;
  box-sizing: border-box;
  border: 1.5px solid var(--blue);
  transform-origin: center center;
}
.ace-handle {
  position: absolute;
  width: 11px;
  height: 11px;
  margin: -5.5px 0 0 -5.5px;
  border: 1.5px solid var(--blue);
  border-radius: 3px;
  background: #fff;
  pointer-events: auto;
  touch-action: none;
}
.ace-rotate-stick {
  position: absolute;
  left: 50%;
  top: -22px;
  width: 1.5px;
  height: 22px;
  margin-left: -0.75px;
  background: var(--blue);
}
.ace-rotate {
  position: absolute;
  left: 50%;
  top: -34px;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  border: 1.5px solid var(--blue);
  border-radius: 50%;
  background: #fff;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
}
@media (pointer: coarse) {
  .ace-handle { width: 18px; height: 18px; margin: -9px 0 0 -9px; }
  .ace-rotate { width: 22px; height: 22px; margin-left: -11px; top: -40px; }
  .ace-rotate-stick { top: -26px; height: 26px; }
}

.ace-height {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 22px;
  margin: 0 auto;
  border-radius: 0 0 8px 8px;
  background: rgba(0, 0, 0, 0.08);
  color: #6e6e73;
  font-size: 11px;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
}
.ace-height:hover { background: rgba(0, 113, 227, 0.15); color: var(--blue); }

.ace-uploading {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  font-size: 13px;
  z-index: 10;
}

@media (max-width: 600px) {
  .ace-head { padding-right: 8px; gap: 6px; }
  .ace-toolbar { padding: 4px 6px; }
  .ace-sep { margin: 0 2px; }
  .ace-btn--label { padding: 0 6px; }
  .ace-body { padding: 12px 8px 80px; }
}
</style>
