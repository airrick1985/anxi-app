<template>
    <v-dialog
      v-model="open"
      width="1000"
      scrollable
      retain-focus
      persistent
      no-click-animation
      :close-on-back="false"
      :attach="'body'"
    >
      <v-card>
        <!-- ────── 工具列 ────────────────────────── -->
        <v-toolbar flat color="primary" dark density="comfortable">
          <!-- 色彩選擇 -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon v-bind="props"><v-icon>mdi-palette</v-icon></v-btn>
            </template>
            <v-color-picker v-model="strokeColor" hide-inputs hide-mode-switch />
          </v-menu>
  
          <!-- 筆寬選擇 -->
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
  
        <!-- ────── Canvas ─────────────────────── -->
        <div class="editor-wrapper">
          <canvas ref="canvasEl" class="editor-canvas" />
        </div>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, nextTick } from 'vue'
  import { fabric } from 'fabric'
  
  const props = defineProps<{ file: File; modelValue: boolean }>()
  const emit = defineEmits<{
    'update:modelValue': [boolean]
    done: [File]
    cancel: []
  }>()
  
/* ---------- state ---------- */
const open        = ref(props.modelValue)
const canvasEl    = ref<HTMLCanvasElement | null>(null)
let   canvas      : fabric.Canvas
const strokeColor = ref('#ff0000')
const strokeWidth = ref(3)

  
/* ---------- dialog v‑model ---------- */
watch(() => props.modelValue, v => (open.value = v))
watch(open, v => emit('update:modelValue', v))
  
/* ---------- init ---------- */
onMounted(() => nextTick(initCanvas))
  
function initCanvas () {
  canvas = new fabric.Canvas(canvasEl.value!, { selection: true })
  canvas.upperCanvasEl.tabIndex = 1000        // 讓 Canvas 可拿到焦點
  canvas.upperCanvasEl.focus()

  /* toolbar → 畫布同步 */
  watch([strokeColor, strokeWidth], () => {
    canvas.freeDrawingBrush.color = strokeColor.value
    canvas.freeDrawingBrush.width = strokeWidth.value
    canvas.getActiveObjects().forEach(applyStroke)
    canvas.requestRenderAll()
  })

  /* 背景圖 */
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

  /* 雙擊 IText 立即編輯 */
  canvas.on('mouse:dblclick', e => {
    const obj = e.target
    if (obj && obj.type === 'textbox') {
      canvas.setActiveObject(obj)
      setTimeout(() => {
        (obj as fabric.IText).enterEditing()
        ;(obj as fabric.IText).hiddenTextarea?.focus()
      }, 0)
    }
  })

  /* ↓↓↓ **關鍵補丁：阻止鍵盤事件向上冒泡** ↓↓↓ */
  canvas.on('text:editing:entered', e => {
    const itext = e.target as fabric.IText
    const ta = itext.hiddenTextarea
    if (!ta) return
    const stop = (ev: KeyboardEvent) => ev.stopPropagation()
    ta.addEventListener('keydown',  stop)
    ta.addEventListener('keyup',    stop)
    ta.addEventListener('keypress', stop)
    const off = () => {
      ta.removeEventListener('keydown',  stop)
      ta.removeEventListener('keyup',    stop)
      ta.removeEventListener('keypress', stop)
      itext.off('editing:exited', off)
    }
    itext.on('editing:exited', off)
  })
}
  
/* ---------- helpers ---------- */
function applyStroke (o: fabric.Object & { [key: string]: any }) {
  if (o.stroke      !== undefined) o.set('stroke', strokeColor.value)
  if (o.strokeWidth !== undefined) o.set('strokeWidth', strokeWidth.value)
}
  
  function syncToolbar () {
    const obj = canvas.getActiveObject() as (fabric.Object & { [key: string]: any }) | undefined
    if (!obj) return
    if (obj.stroke !== undefined) strokeColor.value = obj.stroke as string
    if (obj.strokeWidth !== undefined) strokeWidth.value = obj.strokeWidth as number
  }
  
  /* ---------- tools ---------- */
function addRect () {
  const r = new fabric.Rect({ left: 60, top: 60, width: 160, height: 100, fill: 'transparent' })
  applyStroke(r)
  canvas.add(r).setActiveObject(r)
}
function addCircle () {
  const c = new fabric.Circle({ left: 120, top: 120, radius: 45, fill: 'transparent' })
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
  const t = new fabric.IText('雙擊輸入', { left: 80, top: 80, fill: strokeColor.value, fontSize: 24 })
  canvas.add(t).setActiveObject(t)
  setTimeout(() => {
    t.enterEditing()
    t.hiddenTextarea?.focus()
  }, 0)
}
  
/* ---------- export ---------- */
async function exportImage () {
  canvas.discardActiveObject().renderAll()
  const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.92 })
  const blob    = await (await fetch(dataURL)).blob()
  emit('done', new File([blob], props.file.name, { type: 'image/jpeg' }))
  open.value = false
}
  </script>
  
  <style scoped>
  .editor-wrapper {
    max-width: 100vw;
    overflow: auto;
  }
  .editor-canvas {
    touch-action: none;
    max-height: 80vh;
    width: 100%;
    height: auto;
  }
  </style>
  