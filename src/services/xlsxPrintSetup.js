/**
 * xlsx 列印設定後處理
 *
 * xlsx-js-style（SheetJS CE）只會寫出 pageMargins 與 definedNames，
 * 不支援 pageSetup（紙張／方向／縮放）與 printOptions（置中），
 * 因此在產出後直接改寫 xl/worksheets/sheetN.xml。
 */
import JSZip from 'jszip';

/** Excel「窄」邊界（英吋） */
export const NARROW_MARGINS = { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

const PAGE_SETUP = '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="1"/>';
const PRINT_OPTIONS = '<printOptions horizontalCentered="1"/>';
const FIT_TO_PAGE = '<pageSetUpPr fitToPage="1"/>';
const DEFAULT_MARGINS = `<pageMargins left="${NARROW_MARGINS.left}" right="${NARROW_MARGINS.right}" top="${NARROW_MARGINS.top}" bottom="${NARROW_MARGINS.bottom}" header="${NARROW_MARGINS.header}" footer="${NARROW_MARGINS.footer}"/>`;

/** 單張工作表 XML：A4 橫式、寬高各 1 頁、水平置中（垂直靠上為預設） */
export function patchSheetXml(xml) {
  let out = String(xml);
  if (/<pageSetup\b/.test(out)) return out; // 已有設定就不動

  // sheetPr：fitToPage 需放在 sheetPr 內（pageSetUpPr 在 tabColor/outlinePr 之後）
  if (/<sheetPr\b[^>]*\/>/.test(out)) {
    out = out.replace(/<sheetPr\b([^>]*)\/>/, `<sheetPr$1>${FIT_TO_PAGE}</sheetPr>`);
  } else if (/<sheetPr\b/.test(out)) {
    out = out.replace(/<\/sheetPr>/, `${FIT_TO_PAGE}</sheetPr>`);
  } else {
    out = out.replace(/(<worksheet\b[^>]*>)/, `$1<sheetPr>${FIT_TO_PAGE}</sheetPr>`);
  }

  // printOptions → pageMargins → pageSetup（schema 順序）
  if (/<pageMargins\b[^>]*\/>/.test(out)) {
    out = out.replace(/(<pageMargins\b[^>]*\/>)/, `${PRINT_OPTIONS}$1${PAGE_SETUP}`);
  } else {
    const block = `${PRINT_OPTIONS}${DEFAULT_MARGINS}${PAGE_SETUP}`;
    const anchor = out.match(/<(headerFooter|rowBreaks|colBreaks|customProperties|cellWatches|ignoredErrors|smartTags|drawing|legacyDrawing|picture|oleObjects|controls|webPublishItems|tableParts|extLst)\b/);
    out = anchor
      ? out.slice(0, anchor.index) + block + out.slice(anchor.index)
      : out.replace(/<\/worksheet>/, `${block}</worksheet>`);
  }
  return out;
}

/** 對 xlsx 二進位（ArrayBuffer / Uint8Array）的所有工作表套用列印設定，回傳 Blob */
export async function applyPrintSetup(xlsxBinary) {
  const zip = await JSZip.loadAsync(xlsxBinary);
  const sheets = Object.keys(zip.files).filter(p => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
  for (const p of sheets) {
    const xml = await zip.file(p).async('string');
    zip.file(p, patchSheetXml(xml));
  }
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });
}
