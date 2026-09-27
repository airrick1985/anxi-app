<template>
  <v-dialog :model-value="modelValue" :fullscreen="mobile" max-width="920" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card class="blank-form-dialog">
      <div class="blank-form-bar">
        <strong>列印空白表單</strong>
        <v-spacer />
        <v-btn variant="tonal" color="#46664f" :size="mobile ? 'small' : 'default'" prepend-icon="mdi-printer-outline" :disabled="!ready || busy" @click="printSheets">列印</v-btn>
        <v-btn variant="flat" color="#46664f" :size="mobile ? 'small' : 'default'" prepend-icon="mdi-file-pdf-box" :loading="busy" :disabled="!ready" @click="downloadPdf">下載 PDF</v-btn>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="關閉" @click="emit('update:modelValue', false)" />
      </div>
      <v-card-text ref="viewport" class="blank-form-view">
        <div v-if="error" class="blank-form-state" role="alert">
          <p>{{ error }}</p>
          <v-btn variant="text" color="#46664f" @click="load">重新載入</v-btn>
        </div>
        <div v-else-if="!ready" class="blank-form-state"><v-progress-circular indeterminate color="#54715d" /></div>
        <iframe ref="frame" class="blank-form-frame" :class="{ hidden: !ready || error }" title="客戶資料表預覽"></iframe>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { fetchCustomerSheetSettings } from '@/api';
import { customerFormPrintQr } from '@/utils/customerFormLink';

const props = defineProps({
  modelValue: Boolean,
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
  salesName: { type: String, default: '' },
  formUrl: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'notify']);
const { mobile } = useDisplay();
const frame = ref(null);
const viewport = ref(null);
const ready = ref(false);
const busy = ref(false);
const error = ref('');
let loadToken = 0;
let resizeObserver;

const SHEET_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#e8eae3}
body{font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',system-ui,sans-serif;color:#1f2a24;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#pages{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.sheet{width:210mm;height:297mm;flex:none;background:#fff;display:flex;flex-direction:column;padding:13mm 15mm 9mm;box-shadow:0 2px 12px rgba(40,60,45,.14)}
.sheet-body{flex:1;min-height:0;overflow:hidden}
.sheet-foot{flex:none;display:flex;justify-content:space-between;padding-top:2.5mm;border-top:.3mm solid #dfe3dc;font-size:8.5pt;color:#8a938c}
#flow{position:absolute;left:-9999px;top:0;width:210mm}
.doc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;padding-bottom:3mm;border-bottom:.6mm solid #46664f}
.project{font-size:12pt;font-weight:700;color:#46664f;letter-spacing:.5pt}
.doc-head h1{margin:1mm 0 2mm;font-size:21pt;letter-spacing:4pt;font-weight:800}
.meta{font-size:11pt;color:#3e4b43;line-height:1.7}
.meta b{font-size:12pt;color:#1f2a24}
.qr{flex:none;display:flex;flex-direction:column;align-items:center;gap:1mm;font-size:8.5pt;color:#5d6a60}
.qr img{width:34mm;height:34mm;display:block;image-rendering:pixelated}
.sec{display:flex;justify-content:space-between;align-items:baseline;margin:5mm 0 1mm;padding:1.6mm 3mm;background:#eef2e8;border-left:1.2mm solid #46664f;font-size:12.5pt;letter-spacing:2pt}
.sec span{font-size:9pt;font-weight:400;letter-spacing:0;color:#66735f}
.row{display:flex;gap:8mm}
.write{flex:1;min-width:0;display:flex;align-items:flex-end;gap:2.5mm;height:11mm;font-size:11pt}
.write.date{flex:none}
.write label{flex:none;font-weight:700}
.line{flex:1;min-width:10mm;height:6.5mm;border-bottom:.35mm solid #5a665e}
.fixed{flex:none}
.w14{width:14mm}.w26{width:26mm}
.unit{flex:none;font-size:10.5pt;color:#3e4b43;padding-bottom:.6mm}
i.req{font-style:normal;color:#b3261e;margin-left:.6mm}
.q{padding:2.6mm 0 2.4mm;border-bottom:.25mm dashed #d3d9cd}
.q-title{display:flex;align-items:baseline;gap:2mm;margin-bottom:2mm;font-size:11pt;font-weight:700}
.q-no{color:#46664f}
.mode{margin-left:auto;padding:.3mm 2mm;border:.25mm solid #b9c4b1;border-radius:3mm;font-size:8.5pt;font-weight:400;color:#5d6a60}
.opts{display:flex;flex-wrap:wrap;gap:2.6mm 7mm;padding-left:1mm}
.opt{display:inline-flex;align-items:center;gap:1.8mm;font-size:10.5pt;line-height:1.35}
.box{flex:none;width:4.4mm;height:4.4mm;border:.35mm solid #3d4a42;border-radius:.7mm}
.single .box{border-radius:50%}
.opt .line{flex:none;width:34mm;height:5mm}
.consent{margin-top:5mm;padding:3mm 4mm 2mm;border:.3mm solid #cfd6c8;border-radius:2mm;background:#fafbf7}
.consent .opt{align-items:flex-start;font-size:10.5pt}
.consent .box{margin-top:.8mm}
.consent .row{margin-top:0}
.dense .doc-head h1{font-size:19pt;margin:.5mm 0 1mm}.dense .qr img{width:30mm;height:30mm}.dense .sec{margin:3mm 0 .5mm;padding:1.2mm 3mm}.dense .write{height:9.5mm}.dense .q{padding:1.8mm 0 1.6mm}.dense .q-title{margin-bottom:1.4mm}.dense .opts{gap:2mm 6mm}.dense .consent{margin-top:3mm;padding:2.4mm 4mm 1.6mm}
@media screen{body{zoom:var(--zoom,1)}}
.capturing .sheet{box-shadow:none}
@page{size:A4 portrait;margin:0}
@media print{html,body{background:#fff}#pages{display:block;padding:0}.sheet{box-shadow:none;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}}
`;

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const req = on => (on ? '<i class="req">＊</i>' : '');

function sortedFields(map = {}) {
  return Object.entries(map)
    .filter(([, field]) => Array.isArray(field?.options) && field.options.length)
    .sort(([, a], [, b]) => (a.order || 99) - (b.order || 99))
    .map(([key, field]) => ({ key, ...field }));
}

function questionHtml(field, number) {
  const multiple = field.selectionMode === 'multiple';
  const options = field.options.map(option => `<span class="opt"><b class="box"></b>${escapeHtml(option)}</span>`);
  if (field.allowCustom) options.push('<span class="opt"><b class="box"></b>其他<span class="line"></span></span>');
  return `<div class="q ${multiple ? 'multiple' : 'single'}">
    <div class="q-title">${number ? `<span class="q-no">${number}.</span>` : ''}<span>${escapeHtml(field.label)}${req(field.isRequired)}</span><span class="mode">${multiple ? '可複選' : '單選'}</span></div>
    <div class="opts">${options.join('')}</div></div>`;
}

const dateHtml = '<span class="line fixed w14"></span><span class="unit">年</span><span class="line fixed w14"></span><span class="unit">月</span><span class="line fixed w14"></span><span class="unit">日</span>';

function buildHtml(settings, qrImage) {
  const base = settings.customerFieldSettings || {};
  const questions = sortedFields(settings.vipFormFields);
  const project = escapeHtml(props.projectName);
  const blocks = [
    `<header class="doc-head"><div><div class="project">${project}</div><h1>客戶資料表</h1><div class="meta">銷售人員：<b>${escapeHtml(props.salesName)}</b></div></div>${qrImage ? `<div class="qr"><img src="${qrImage}" alt=""><span>掃描可線上填寫</span></div>` : ''}</header>`,
    '<h2 class="sec keep-next">基本資料<span>＊ 為必填</span></h2>',
    `<div class="row"><div class="write"><label>姓名${req(true)}</label><span class="line"></span></div><div class="write"><label>電話${req(true)}</label><span class="line"></span></div></div>`,
    `<div class="row"><div class="write date"><label>拜訪日期${req(true)}</label>${dateHtml}</div><div class="write"><label>任職公司</label><span class="line"></span></div></div>`,
  ];
  if (base.age?.options?.length) blocks.push(questionHtml({ ...base.age, label: base.age.label || '年齡' }));
  blocks.push(`<div class="row"><div class="write"><label>居住地址${req(true)}</label><span class="line fixed w26"></span><span class="unit">縣／市</span><span class="line fixed w26"></span><span class="unit">鄉鎮市區</span><span class="line"></span></div></div>`);
  if (base.occupation?.options?.length) blocks.push(questionHtml({ ...base.occupation, label: base.occupation.label || '職業' }));
  if (questions.length) {
    blocks.push('<h2 class="sec keep-next">需求資訊</h2>');
    questions.forEach((field, index) => blocks.push(questionHtml(field, index + 1)));
  }
  blocks.push(`<div class="consent"><div class="opt"><b class="box"></b><span>本人同意提供以上個人資料，供「${project}」作為購屋資訊聯繫與服務使用。</span></div><div class="row"><div class="write"><label>簽名</label><span class="line"></span></div><div class="write date"><label>日期</label>${dateHtml}</div></div></div>`);
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>${project}_客戶資料表</title><style>${SHEET_CSS}</style></head><body><div id="pages"></div><div id="flow">${blocks.join('')}</div></body></html>`;
}

function layoutSheets(doc) {
  const source = doc.getElementById('flow').innerHTML;
  const run = dense => {
    doc.body.classList.toggle('dense', dense);
    doc.getElementById('pages').innerHTML = '';
    let flow = doc.getElementById('flow');
    if (!flow) {
      flow = doc.createElement('div');
      flow.id = 'flow';
      doc.body.appendChild(flow);
    }
    flow.innerHTML = source;
    return paginate(doc);
  };
  if (run(false) > 1 && run(true) > 1) run(false);
}

function paginate(doc) {
  const pages = doc.getElementById('pages');
  const flow = doc.getElementById('flow');
  const blocks = [...flow.children];
  let body;
  const newPage = () => {
    const sheet = doc.createElement('section');
    sheet.className = 'sheet';
    body = doc.createElement('div');
    body.className = 'sheet-body';
    const foot = doc.createElement('div');
    foot.className = 'sheet-foot';
    sheet.append(body, foot);
    pages.appendChild(sheet);
  };
  newPage();
  for (const block of blocks) {
    body.appendChild(block);
    if (body.scrollHeight <= body.clientHeight + 1 || body.children.length === 1) continue;
    const carry = [block];
    const prev = block.previousElementSibling;
    if (prev?.classList.contains('keep-next') && body.children.length > 2) carry.unshift(prev);
    newPage();
    body.append(...carry);
  }
  flow.remove();
  const sheets = [...pages.querySelectorAll('.sheet')];
  sheets.forEach((sheet, index) => {
    sheet.querySelector('.sheet-foot').innerHTML = `<span>${escapeHtml(props.projectName)}・客戶資料表</span><span>${index + 1} / ${sheets.length}</span>`;
  });
  return sheets.length;
}

function fitPreview() {
  const doc = frame.value?.contentDocument;
  const host = viewport.value?.$el ?? viewport.value;
  if (!doc?.body || !host) return;
  const available = host.clientWidth - 8;
  const natural = doc.querySelector('.sheet')?.offsetWidth + 32 || 826;
  const zoom = Math.min(1, available / natural);
  doc.body.style.setProperty('--zoom', zoom);
  frame.value.style.height = `${Math.ceil(doc.getElementById('pages').offsetHeight * zoom) + 4}px`;
}

async function waitImages(doc) {
  const assets = Promise.all([
    ...[...doc.images].map(img => (img.complete ? null : new Promise(resolve => { img.onload = img.onerror = resolve; }))),
    doc.fonts?.ready,
  ]);
  await Promise.race([assets, new Promise(resolve => setTimeout(resolve, 3000))]);
}

async function waitFrame() {
  for (let i = 0; i < 20 && !frame.value; i++) await new Promise(resolve => setTimeout(resolve, 50));
  if (!frame.value) throw new Error('預覽框架未就緒');
  return frame.value;
}

function writeFrame(iframe, html) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('預覽載入逾時')); }, 10000);
    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc?.getElementById('flow')) return;
      cleanup();
      resolve(doc);
    };
    const cleanup = () => { clearTimeout(timer); iframe.removeEventListener('load', onLoad); };
    iframe.addEventListener('load', onLoad);
    iframe.srcdoc = html;
  });
}

async function load() {
  const token = ++loadToken;
  ready.value = false;
  error.value = '';
  try {
    const [settings, qrImage] = await Promise.all([
      fetchCustomerSheetSettings(props.projectId),
      props.formUrl ? customerFormPrintQr(props.formUrl).catch(() => '') : '',
    ]);
    if (token !== loadToken) return;
    if (settings?.status !== 'success') throw new Error(settings?.message || '表單欄位載入失敗');
    await nextTick();
    const iframe = await waitFrame();
    const doc = await writeFrame(iframe, buildHtml(settings, qrImage));
    if (token !== loadToken) return;
    await waitImages(doc);
    if (token !== loadToken) return;
    layoutSheets(doc);
    ready.value = true;
    await nextTick();
    fitPreview();
  } catch (err) {
    if (token !== loadToken) return;
    console.error('[BlankCustomerFormDialog] 預覽載入失敗:', err);
    error.value = '表單預覽載入失敗，請稍後再試。';
  }
}

function withNaturalZoom(task) {
  const body = frame.value.contentDocument.body;
  const zoom = body.style.getPropertyValue('--zoom');
  body.style.setProperty('--zoom', 1);
  body.classList.add('capturing');
  return Promise.resolve(task()).finally(() => {
    body.classList.remove('capturing');
    body.style.setProperty('--zoom', zoom);
  });
}

function printSheets() {
  const win = frame.value?.contentWindow;
  if (!win) return;
  win.focus();
  win.print();
}

async function downloadPdf() {
  if (busy.value || !ready.value) return;
  busy.value = true;
  try {
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
    await withNaturalZoom(async () => {
      const sheets = [...frame.value.contentDocument.querySelectorAll('.sheet')];
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      for (const [index, sheet] of sheets.entries()) {
        const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff', logging: false, width: sheet.offsetWidth, height: sheet.offsetHeight, windowWidth: sheet.offsetWidth + 40 });
        if (index) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
      }
      pdf.save(`${[props.projectName, props.salesName, '客戶資料表'].filter(Boolean).join('_')}.pdf`.replace(/[\\/:*?"<>|]/g, '_'));
    });
  } catch (err) {
    console.error('[BlankCustomerFormDialog] PDF 產生失敗:', err);
    emit('notify', 'PDF 產生失敗，請稍後再試。');
  } finally {
    busy.value = false;
  }
}

watch(() => [props.modelValue, props.projectId], ([open]) => {
  if (open && props.projectId) load();
  else loadToken++;
});
watch(viewport, el => {
  resizeObserver?.disconnect();
  const host = el?.$el ?? el;
  if (!host) return;
  resizeObserver = new ResizeObserver(() => { if (ready.value) fitPreview(); });
  resizeObserver.observe(host);
});
onBeforeUnmount(() => { loadToken++; resizeObserver?.disconnect(); });
</script>

<style scoped>
.blank-form-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px 10px 20px; border-bottom: 1px solid #e3e8da; color: #304c40; }
.blank-form-view { padding: 0 !important; background: #e8eae3; }
.blank-form-frame { display: block; width: 100%; min-height: 200px; border: 0; }
.blank-form-frame.hidden { position: absolute; visibility: hidden; height: 0; min-height: 0; }
.blank-form-state { min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #607258; }
@media (max-width: 600px) {
  .blank-form-bar { padding-left: 14px; gap: 4px; }
  .blank-form-bar strong { font-size: 14px; }
}
</style>
