// 合約附圖放進附圖頁紙張大小：A3 圖縮到 A4、A4 圖維持 100%、旋轉以 /Rotate 疊加
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { mergeAttachments, fitAttachmentOnPaper } = require('../../functions/contractDocument.js');
const { PDFDocument, degrees } = require('../../functions/node_modules/pdf-lib');

const A4 = [595.28, 841.89];
const A3 = [841.89, 1190.55];

async function makePdf(sizes, rotate = 0) {
  const doc = await PDFDocument.create();
  for (const size of sizes) {
    const page = doc.addPage(size);
    page.drawRectangle({ x: 10, y: 10, width: size[0] - 20, height: size[1] - 20, borderWidth: 4 });
    if (rotate) page.setRotation(degrees(rotate));
  }
  return Buffer.from(await doc.save());
}

async function merge(files) {
  const base = await makePdf([A4]);
  const out = await PDFDocument.load(await mergeAttachments(base, files));
  return out.getPages().slice(1).map(p => ({
    w: Math.round(p.getWidth()), h: Math.round(p.getHeight()), rotation: p.getRotation().angle,
  }));
}

const pdfFile = (buffer, extra = {}) => ({ fileName: 'a.pdf', mimeType: 'application/pdf', buffer, ...extra });

test('A3 橫式圖縮到 A4 橫式紙張，旋轉 90° 以 /Rotate 呈現', async () => {
  const pages = await merge([pdfFile(await makePdf([[A3[1], A3[0]]]), { rotation: 90, paperSize: 'A4' })]);
  assert.deepEqual(pages, [{ w: 842, h: 595, rotation: 90 }]);
});

test('A4 圖維持 100%，不縮放', async () => {
  const fit = fitAttachmentOnPaper(A4[0], A4[1], 'A4');
  assert.equal(fit.scale, 1);
  assert.deepEqual([fit.x, fit.y], [0, 0]);
  const pages = await merge([pdfFile(await makePdf([A4]), { paperSize: 'A4' })]);
  assert.deepEqual(pages, [{ w: 595, h: 842, rotation: 0 }]);
});

test('A3 圖縮放後四周留白、置中', () => {
  const fit = fitAttachmentOnPaper(A3[1], A3[0], 'A4');
  assert.equal(Math.round(fit.pageW), 842);
  assert.ok(fit.scale < 0.7 && fit.scale > 0.6);
  assert.ok(fit.x >= 20 - 0.01 && fit.y >= 20 - 0.01);
  assert.ok(Math.abs(fit.x * 2 + A3[1] * fit.scale - fit.pageW) < 0.01);
});

test('原頁已有 /Rotate 時與使用者旋轉疊加', async () => {
  const pages = await merge([pdfFile(await makePdf([A3], 90), { rotation: 90, paperSize: 'A4' })]);
  assert.deepEqual(pages, [{ w: 595, h: 842, rotation: 180 }]);
});

test('頁碼範圍逐頁處理；未指定紙張預設 A4；附圖頁設 A3 時 A3 圖不縮', async () => {
  const buf = await makePdf([A3, A3, A3]);
  assert.deepEqual(await merge([pdfFile(buf, { pageRange: '1-2' })]), [
    { w: 595, h: 842, rotation: 0 }, { w: 595, h: 842, rotation: 0 },
  ]);
  assert.deepEqual(await merge([pdfFile(buf, { pageRange: '3', paperSize: 'A3' })]), [{ w: 842, h: 1191, rotation: 0 }]);
});
