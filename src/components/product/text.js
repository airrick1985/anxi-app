// 斷行輔助：渲染時把不該拆開的片段包成不換行（不改共用文案字串，deck 畫面不受影響）
import { h } from 'vue';

// 業界詞表：瀏覽器的 Intl.Segmenter（Safari 與 Chrome 結果相同）會把這些詞切成單字。
// 來源：把本頁所有說明文字（模組重點、痛點、理由、FAQ、方案說明與備註、試用步驟）跑過 Segmenter，
// 逐一檢視被切成單字的片段後整理（2026-11-18）。新增文案若出現拆詞，補在這裡即可。
const WORDS = [
  // 建案、戶別、銷控
  '建案', '案場', '戶別', '棟別', '每戶', '全戶', '未售戶', '總戶數', '按戶數', '戶數', '該戶', '退戶',
  '銷控', '銷控表', '改價', '表價', '底價', '總價', '單價', '調幅', '期款', '首購', '攤還表',
  '客資', '客源', '新客', '客變', '客訴', '客製', '留資', '高意願', '可查',
  '賞屋', '撞期', '排休', '排程', '對保', '驗屋', '驗交屋', '交屋', '無紙化', '派工',
  // 合約、請佣、面積找補、交屋控管
  '修改前', '修改後', '拆款表', '房土款', '契約常數', '產製', '版型', '套到', '填好', '算好', '標出', '找補', '找補單', '控管表', '占比',
  '墊低法', '墊高法', '介紹費', '退佣', '逐筆', '逐欄', '連點即改', '重拉', '繳款日', '將到',
  // 名單、操作
  '交叉比對', '各來源', '上千筆', '筆數', '本週', '上週', '本月', '跨建案', '資訊卡', '疊上', '貼到', '上傳', '預覽',
  '代發', '綁定', '勾選', '換人', '保留人', '設好', '量給', '量身', '一鍵', '就能用', '就能', '各看各的',
  '紙本', '表單', '電子表板', '表板', '瀏覽器', '建置', '管理員', '多人', '再加', '整年', '現省', '首年',
  '隨需', '更佳', '組數', '按案', '訂閱費',
  // 逐一檢視斷行點後補上（360／390 寬時讀起來會斷在詞中間）
  '同一份', '缺資料', '排時間', '合約附圖', '導入時', '更靈活', '說得清',
];

const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 比對順序：英數組合 → 金額 → 詞表（長詞優先）
const PATTERN = new RegExp([
  '[A-Za-z0-9]+(?:／[A-Za-z0-9]+)+', // PNG／PDF、LINE／Email
  'NT\\$ ?[\\d,]+', // NT$ 5,000
  '二代健保',
  '退戶紀錄',
  ...[...WORDS].sort((a, b) => b.length - a.length).map(escape),
].join('|'), 'g');

// 其餘中文以詞為單位不拆開（Intl.Segmenter；不支援的瀏覽器維持逐字斷行）
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('zh-Hant', { granularity: 'word' }) : null;

function pushWords(out, text) {
  if (!segmenter) { out.push({ t: text, nw: false }); return; }
  for (const w of segmenter.segment(text)) {
    const nw = w.isWordLike && w.segment.length > 1;
    const prev = out[out.length - 1];
    if (!nw && prev && !prev.nw) prev.t += w.segment; // 合併可斷行的片段，減少節點
    else out.push({ t: w.segment, nw });
  }
}

// 全形斜線「／」黏在前一個詞（或前一個字）後面：前面不可斷行、後面可以
function glueSlash(segs) {
  const res = [];
  for (const sg of segs) {
    if (sg.nw || !sg.t.includes('／')) { res.push(sg); continue; }
    sg.t.split('／').forEach((part, i) => {
      if (i > 0) {
        const prev = res[res.length - 1];
        if (prev?.nw) {
          prev.t += '／';
        } else if (prev?.t) {
          const last = prev.t.slice(-1);
          prev.t = prev.t.slice(0, -1);
          if (!prev.t) res.pop();
          res.push({ t: `${last}／`, nw: true });
        } else {
          res.push({ t: '／', nw: false });
        }
      }
      if (part) res.push({ t: part, nw: false });
    });
  }
  return res;
}

/** @returns {{ t: string, nw: boolean }[]} */
export function nowrapSegments(text) {
  // 「甲 × 乙」「甲 → 乙」：符號兩側改不斷行空白，符號不會落在行首或行尾，前後的詞仍照常保護
  const s = String(text ?? '').replace(/ ([×→]) /g, '\u00A0$1\u00A0');
  const out = [];
  let last = 0;
  for (const m of s.matchAll(PATTERN)) {
    if (m.index > last) pushWords(out, s.slice(last, m.index));
    out.push({ t: m[0], nw: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) pushWords(out, s.slice(last));
  return glueSlash(out);
}

/** <NwText :text="..." />：依 nowrapSegments 輸出，不換行片段包 .pp-nw（樣式在 productBase.css） */
export const NwText = (props) => nowrapSegments(props.text).map((seg) => (seg.nw ? h('span', { class: 'pp-nw' }, seg.t) : seg.t));
NwText.props = { text: { type: String, default: '' } };
