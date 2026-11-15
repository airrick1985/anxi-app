// 合約套印：pdfjs 載入（legacy build，同 utils/filePreview.js），附中日韓字型的 CMap。
// CMap 以 Vite glob 打包成獨立檔案，只有遇到需要的 PDF 才會下載。
let pdfjsPromise = null;

const CMAP_URLS = import.meta.glob('/node_modules/pdfjs-dist/cmaps/*.bcmap', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
});

class BundledCMapReaderFactory {
  constructor({ isCompressed = true } = {}) {
    this.isCompressed = isCompressed;
  }

  async fetch({ name }) {
    const url = CMAP_URLS[`/node_modules/pdfjs-dist/cmaps/${name}.bcmap`];
    if (!url) throw new Error(`找不到 CMap：${name}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CMap 下載失敗：${name}`);
    return { cMapData: new Uint8Array(await res.arrayBuffer()), isCompressed: true };
  }
}

export function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    }).catch((err) => {
      pdfjsPromise = null;
      throw err;
    });
  }
  return pdfjsPromise;
}

/** 開啟 PDF（bytes 會被 pdfjs 轉移，傳入複本）；用完呼叫 doc.destroy() */
export async function openPdfBytes(bytes) {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({
    data: bytes.slice(),
    isEvalSupported: false,
    cMapUrl: 'bundled:',
    cMapPacked: true,
    CMapReaderFactory: BundledCMapReaderFactory,
  }).promise;
}
