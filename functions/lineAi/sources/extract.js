// LINE AI 助理：雲端檔案轉文字（PDF、Word、PowerPoint、Excel、純文字）
const JSZip = require('jszip');
const XLSX = require('xlsx');

const MAX_CHARS = 20000;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const MIME = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
};

function kindOf(mimeType, name) {
  const mt = String(mimeType || '').toLowerCase();
  const ext = (String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  for (const [kind, list] of Object.entries(MIME)) if (list.includes(mt)) return kind;
  if (['pdf', 'docx', 'pptx', 'xlsx'].includes(ext)) return ext;
  if (ext === 'xls') return 'xlsx';
  if (mt.startsWith('text/') || ['application/json', 'application/xml'].includes(mt)) return 'text';
  if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'tsv', 'log'].includes(ext)) return 'text';
  return null;
}

function decodeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
}

function clip(text) {
  const t = String(text || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > MAX_CHARS ? { text: t.slice(0, MAX_CHARS), truncated: true } : { text: t, truncated: false };
}

async function pdfText(buf) {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function docxText(buf) {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) return '';
  return decodeXml(xml.replace(/<w:tab\/>/g, '\t').replace(/<w:br\/>|<\/w:p>/g, '\n').replace(/<[^>]+>/g, ''));
}

async function pptxText(buf) {
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const out = [];
  for (const [i, name] of slides.entries()) {
    const xml = await zip.file(name).async('string');
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m => decodeXml(m[1]));
    out.push(`# 第 ${i + 1} 頁\n${texts.join('\n')}`);
  }
  return out.join('\n\n');
}

function xlsxText(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  return wb.SheetNames.slice(0, 8).map(n => `# ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false })}`).join('\n\n');
}

/** @returns {{ text, truncated }} 無法讀取的格式丟錯 */
async function extractText(buf, mimeType, name) {
  const kind = kindOf(mimeType, name);
  let text;
  if (kind === 'pdf') text = await pdfText(buf);
  else if (kind === 'docx') text = await docxText(buf);
  else if (kind === 'pptx') text = await pptxText(buf);
  else if (kind === 'xlsx') text = xlsxText(buf);
  else if (kind === 'text') text = buf.toString('utf8');
  else throw new Error(`不支援讀取這種檔案（${mimeType || name}）`);
  const r = clip(text);
  if (!r.text) throw new Error('檔案沒有可讀取的文字（可能是掃描圖檔）');
  return r;
}

module.exports = { extractText, kindOf, MAX_FILE_BYTES, MAX_CHARS };
