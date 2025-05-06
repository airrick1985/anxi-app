<!-- src/components/PhotoEditor.vue -->
<template>
    <v-dialog
      v-model="open"
      width="1000"
      scrollable
      retain-focus="false"
      class="d-flex justify-center"
    >
      <v-card>
        <!-- ────── 工具列 ─────────────────────────────── -->
        <v-toolbar flat color="primary" dark density="comfortable">
          <!-- 色彩選擇 -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon v-bind="props"><v-icon>mdi-palette</v-icon></v-btn>
            </template>
            <v-color-picker v-model="strokeColor" hide-inputs hide-mode-switch />
          </v-menu>
  
          <!-- 筆寬選擇（滑桿軌道顏色 = 目前筆色） -->
          <v-slider
            v-model="strokeWidth"
            min="1"
            max="20"
            step="1"
            class="mx-3"
            style="max-width:120px"
            hide-details
            :style="`--v-slider-track-active-color:${strokeColor}`"
          />
  
          <v-divider vertical class="mx-2"></v-divider>
  
          <v-btn icon @click="addRect"><v-icon>mdi-rectangle-outline</v-icon></v-btn>
          <v-btn icon @click="addCircle"><v-icon>mdi-circle-outline</v-icon></v-btn>
          <v-btn icon @click="togglePencil">
            <v-icon :color="canvas?.isDrawingMode ? 'yellow lighten-3' : undefined">
              mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn icon @click="addText"><v-icon>mdi-format-text</v-icon></v-btn>
  
          <v-spacer></v-spacer>
          <v-btn text @click="$emit('cancel')">取消</v-btn>
          <v-btn text @click="exportImage">確定</v-btn>
        </v-toolbar>
  
        <!-- ────── Canvas ─────────────────────────────── -->
        <div class="editor-wrapper">
          <canvas ref="canvasEl" class="editor-canvas" />
        </div>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, nextTick } from 'vue'
  import { fabric } from 'fabric'
  
  /* ---------- props / emit -------------------------- */
  const props = defineProps<{ file: File; modelValue: boolean }>()
  const emit = defineEmits<{
    'update:modelValue': [boolean]
    done: [File]
    cancel: []
  }>()
  
  /* ---------- 狀態 ------------------------------- */
  const open = ref(props.modelValue)
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  let canvas: fabric.Canvas
  
  const strokeColor = ref('#ff0000')
  const strokeWidth = ref(3)
  
  /* ---------- Dialog 雙向綁定 -------------------- */
  watch(() => props.modelValue, v => (open.value = v))
  watch(open, v => emit('update:modelValue', v))
  
  /* ---------- 建立 Canvas ------------------------ */
  onMounted(() => nextTick(initCanvas))
  
  function initCanvas () {
    canvas = new fabric.Canvas(canvasEl.value!, { selection: true })
  
    /* 讓 slider / color‑picker 變動時，立即同步到：
       1. 畫筆、2. 目前選取的所有物件                          */
    watch([strokeColor, strokeWidth], () => {
      canvas.freeDrawingBrush.color = strokeColor.value
      canvas.freeDrawingBrush.width = strokeWidth.value
      const active = canvas.getActiveObjects()
      active.forEach(o => applyStroke(o))
      canvas.requestRenderAll()
    })
  
    /* ▲ 當使用者點選物件時，把物件樣式帶回 UI 做同步顯示 —— */
    canvas.on('selection:created', syncToolbar)
    canvas.on('selection:updated', syncToolbar)
  
    /* 背景圖 —— 固定不動、維持比例、依容器寬度縮放         */
    const url = URL.createObjectURL(props.file)
    fabric.Image.fromURL(url, img => {
      const wrapperW = (canvasEl.value!.parentElement as HTMLElement).clientWidth
      const scale = img.width! > wrapperW ? wrapperW / img.width! : 1
      img.scale(scale)
  
      canvas.setWidth(img.width! * scale)
      canvas.setHeight(img.height! * scale)
  
      img.set({ selectable: false, evented: false })
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
    })
  
    /* 允許雙擊 IText 進入編輯（Fabric v4 需要這段） */
    canvas.on('mouse:dblclick', e => {
      const obj = e.target
      if (obj && obj.type === 'textbox') {
        canvas.setActiveObject(obj).renderAll()
        ;(obj as fabric.IText).enterEditing()
        ;(obj as fabric.IText).hiddenTextarea?.focus()
      }
    })
  }
  
  /* ---------- 共用工具 ---------------------------- */
  function applyStroke (obj: fabric.Object) {
    if ('stroke' in obj) obj.set('stroke', strokeColor.value)
    if ('strokeWidth' in obj) obj.set('strokeWidth', strokeWidth.value)
  }
  /* toolbar ‑> canvas 反向同步（選到物件時把 UI 值改成物件的） */
  function syncToolbar () {
    const obj = canvas.getActiveObject() as fabric.Object | undefined
    if (obj) {
      if ('stroke' in obj) strokeColor.value = obj.stroke as string ?? '#ff0000'
      if ('strokeWidth' in obj)
        strokeWidth.value = (obj.strokeWidth as number) ?? 3
    }
  }
  
  /* ---------- 插圖形 / 文字 / 畫筆 ---------------- */
  function addRect () {
    const r = new fabric.Rect({
      left: 60,
      top: 60,
      width: 160,
      height: 100,
      fill: 'transparent'
    })
    applyStroke(r)
    canvas.add(r).setActiveObject(r)
  }
  function addCircle () {
    const c = new fabric.Circle({
      left: 120,
      top: 120,
      radius: 45,
      fill: 'transparent'
    })
    applyStroke(c)
    canvas.add(c).setActiveObject(c)
  }
  function togglePencil () {
    canvas.isDrawingMode = !canvas.isDrawingMode
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = strokeColor.value
      canvas.freeDrawingBrush.width = strokeWidth.value
    }
  }
  function addText () {
    const t = new fabric.IText('雙擊輸入', {
      left: 80,
      top: 80,
      fill: strokeColor.value,
      fontSize: 24
    })
    canvas.add(t).setActiveObject(t)
    t.enterEditing()
    t.hiddenTextarea?.focus()
  }
  
  /* ---------- 匯出 ------------------------------- */
  async function exportImage () {
    canvas.discardActiveObject().renderAll()
    const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.92 })
    const blob = await (await fetch(dataURL)).blob()
    emit('done', new File([blob], props.file.name, { type: 'image/jpeg' }))
    open.value = false
  }
  </script>
  
  <style scoped>
  .editor-wrapper {
    /* 手機時讓畫布隨寬度縮，最大高 80vh */
    max-width: 100vw;
    overflow: auto;
  }
  .editor-canvas {
    touch-action: none;
    max-height: 80vh;
    /* 讓小螢幕自動縮放但不破壞比例 */
    width: 100%;
    height: auto;
  }
  </style>
  