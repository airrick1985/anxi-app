/**
 * 自訂表單「文件匯出模板」註冊表
 *
 * 每個模板定義：
 *  - slots：文件上的資料槽（key、顯示名稱、自動比對用的欄位名稱別名、預設來源）
 *  - buildHtml(values)：產生 A4 版面的 HTML（供預覽與 html2canvas 轉 PDF）
 *  - buildDocx(values)：產生 docx Document（供匯出 Word）
 *  - fileName(values)：預設檔名（不含副檔名）
 *
 * 模板不綁定建案：資料槽在匯出時依「欄位名稱」自動比對該建案表單的欄位，
 * 使用者可手動調整對應並儲存於該表單文件（exportMappings.<templateKey>），
 * 因此同一模板可直接套用給其他建案的同類表單。
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, VerticalAlign, HeightRule, BorderStyle,
} from 'docx';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/firebase';

export interface ExportSlot {
  key: string;
  name: string;            // 對應面板顯示名稱
  aliases?: string[];      // 自動比對的表單欄位名稱（含本名）
  defaultSource?: 'projectName' | 'unitId' | 'today' | 'literal';
  defaultLiteral?: string; // defaultSource === 'literal' 時的預設文字
  multiline?: boolean;
  /** 預設智慧來源（smartSources 的 key） */
  smartDefault?: string;
  /** beforeField：智慧來源優先於表單欄位比對（系統資料為權威）；afterField：先比對表單欄位，沒有才用智慧來源 */
  smartPriority?: 'beforeField' | 'afterField';
}

export interface FormExportTemplate {
  key: string;
  name: string;
  description: string;
  slots: ExportSlot[];
  buildHtml: (values: Record<string, string>) => string;
  buildDocx: (values: Record<string, string>) => Document;
  fileName: (values: Record<string, string>) => string;
}

// ---------- 共用工具 ----------

/** 欄位名稱正規化（供自動比對）：去空白、全半形括號、冒號、大小寫 */
export const normalizeLabel = (s: string): string =>
  String(s || '')
    .toLowerCase()
    .replace(/[\s()（）:：\-_/／]/g, '');

/** 將表單值轉為可顯示文字（地址物件攤平、陣列以頓號連接） */
export const formatSlotValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(v => formatSlotValue(v)).filter(Boolean).join('、');
  if (typeof val === 'object') {
    if ('city' in val || 'district' in val || 'detail' in val) {
      return `${val.city || ''}${val.district || ''}${val.detail || ''}`.trim();
    }
    return JSON.stringify(val);
  }
  return String(val);
};

const esc = (s: string): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escBr = (s: string): string => esc(s).replace(/\n/g, '<br>');

// ---------- 智慧來源（跨建案通用的動態資料計算器） ----------
//
// 智慧來源不依賴表單欄位結構，而是以 projectId / unitId 即時查詢系統資料或計算，
// 因此任何建案套用模板時皆可直接使用，這是「高度客製化模板仍可跨建案共用」的關鍵。

export interface SmartSourceContext {
  projectId: string;
  unitId: string;
  /** 該表單所有欄位名稱（含子欄位） */
  fieldLabels: string[];
  /** 依欄位名稱取得該筆回覆的原始值 */
  getFieldValue: (label: string) => any;
}

export interface SmartSource {
  key: string;
  /** 儲存於欄位對應中的值（以 ⚙ 開頭供辨識與顯示） */
  token: string;
  description: string;
  resolve: (ctx: SmartSourceContext) => Promise<string>;
}

/** 出生日期欄位的常見名稱（正規化後比對） */
const BIRTHDAY_ALIASES = ['出生年月日', '出生日期', '生日', 'birthday', 'birthdate', 'dateofbirth', 'birth', 'dob'];

/** 在表單欄位名稱中尋找出生日期欄位 */
export const findBirthdayLabel = (labels: string[]): string => {
  const normalized = labels.map(l => ({ label: l, norm: normalizeLabel(l) }));
  for (const alias of BIRTHDAY_ALIASES) {
    const target = normalizeLabel(alias);
    const hit = normalized.find(n => n.norm === target || n.norm.includes(target));
    if (hit) return hit.label;
  }
  return '';
};

/** 寬鬆解析日期：yyyy-MM-dd / yyyy/MM/dd / 民國 {year,month,day} 物件 / Date */
const parseDateLoose = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'object') {
    // 民國或西元的 {year, month, day} 物件
    const y = Number(val.year), m = Number(val.month), d = Number(val.day);
    if (y && m && d) {
      const year = y < 1911 ? y + 1911 : y; // 年份小於 1911 視為民國年
      const date = new Date(year, m - 1, d);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
  const s = String(val).trim().replace(/\//g, '-');
  // 純數字民國格式（如 790417）不處理，避免誤判
  const match = s.match(/^(\d{2,4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    let year = Number(match[1]);
    if (year < 1911) year += 1911; // 民國年
    const date = new Date(year, Number(match[2]) - 1, Number(match[3]));
    return isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/** 計算足歲年齡 */
const calcAge = (birth: Date): number => {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age;
};

export const smartSources: SmartSource[] = [
  {
    key: 'ageFromBirthday',
    token: '⚙ 年齡（依出生日期自動計算）',
    description: '自動尋找表單中的出生日期欄位（出生年月日／生日／birthday…）計算足歲年齡。',
    async resolve(ctx) {
      const label = findBirthdayLabel(ctx.fieldLabels);
      if (!label) return '';
      const birth = parseDateLoose(ctx.getFieldValue(label));
      if (!birth) return '';
      const age = calcAge(birth);
      return age >= 0 && age < 150 ? String(age) : '';
    },
  },
  {
    key: 'salesManager',
    token: '⚙ 專案經理（銷售人員管理·職位=專案）',
    description: '讀取該建案「銷售人員管理」中職位包含「專案」的人員姓名。',
    async resolve(ctx) {
      if (!ctx.projectId) return '';
      const snapshot = await getDocs(query(
        collection(db, 'salesPersonnel'),
        where('projectId', '==', ctx.projectId),
      ));
      const managers = snapshot.docs
        .map(d => d.data() as any)
        .filter(p => Array.isArray(p.positions) &&
          p.positions.some((pos: string) => String(pos).includes('專案')))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map(p => p.name)
        .filter(Boolean);
      return managers.join('、');
    },
  },
  {
    key: 'unitSalesperson',
    token: '⚙ 目前銷售人員（銷控戶別）',
    description: '依此筆資料的戶別，讀取銷控系統該戶目前的銷售人員。',
    async resolve(ctx) {
      if (!ctx.projectId || !ctx.unitId) return '';
      // 先以 docId 規則直接讀取，失敗再用 unitId 欄位查詢（相容舊資料）
      let data: any = null;
      const direct = await getDoc(doc(db, 'salesHouseholds', `${ctx.projectId}_${ctx.unitId}`));
      if (direct.exists()) {
        data = direct.data();
      } else {
        const snapshot = await getDocs(query(
          collection(db, 'salesHouseholds'),
          where('projectId', '==', ctx.projectId),
          where('unitId', '==', ctx.unitId),
          limit(1),
        ));
        if (!snapshot.empty) data = snapshot.docs[0].data();
      }
      if (!data) return '';
      // salesperson 為姓名陣列；相容舊版單一字串／逗號分隔字串
      const raw = data.salesperson;
      const list = Array.isArray(raw)
        ? raw
        : String(raw || '').split(/[,、]/);
      return list.map((s: any) => String(s).trim()).filter(Boolean)
        .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
        .join('、');
    },
  },
];

export const isSmartToken = (v: any): boolean => typeof v === 'string' && v.startsWith('⚙');
export const getSmartSourceByToken = (token: string): SmartSource | undefined =>
  smartSources.find(s => s.token === token);
export const getSmartSourceByKey = (key: string): SmartSource | undefined =>
  smartSources.find(s => s.key === key);

// ---------- 模板一：客戶資料卡 ----------

const CUSTOMER_CARD_SLOTS: ExportSlot[] = [
  { key: 'caseName', name: '案名', defaultSource: 'projectName', aliases: ['案名', '建案名稱'] },
  { key: 'unitId', name: '戶別', defaultSource: 'unitId', aliases: ['戶別', '戶號'] },
  { key: 'date', name: '日期', defaultSource: 'today', aliases: ['日期', '填表日期'] },
  { key: 'customerName', name: '客戶姓名', aliases: ['客戶姓名', '買方姓名', '姓名'] },
  // 表單有「年齡」欄位就用欄位值；沒有才改用出生日期自動計算
  { key: 'age', name: '年齡', aliases: ['年齡'], smartDefault: 'ageFromBirthday', smartPriority: 'afterField' },
  { key: 'gender', name: '性別', aliases: ['性別'] },
  { key: 'marital', name: '婚姻狀況', aliases: ['婚姻狀況', '婚姻', '已婚未婚'] },
  { key: 'occupation', name: '職業', aliases: ['職業', '行業別'] },
  { key: 'jobTitle', name: '職務', aliases: ['職務', '職稱'] },
  { key: 'phoneHome', name: '電話(H)', aliases: ['電話H', '住家電話', '家用電話'] },
  { key: 'phoneOffice', name: '電話(O)', aliases: ['電話O', '公司電話', '辦公電話'] },
  { key: 'address', name: '通訊地址', aliases: ['通訊地址', '地址', '買方地址', '戶籍地址'] },
  { key: 'mobile', name: '行動電話', aliases: ['行動電話', '手機', '手機號碼', '買方電話', '電話'] },
  { key: 'email', name: 'E-mail', aliases: ['email', 'e-mail', '電子郵件', '電子信箱', '買方email'] },
  { key: 'specialty', name: '專長', aliases: ['專長'] },
  { key: 'motivation', name: '購買動機', aliases: ['購買動機'] },
  { key: 'interest', name: '興趣', aliases: ['興趣'] },
  { key: 'purchasedLabel', name: '已購題目文字', defaultSource: 'literal', defaultLiteral: '已購買富宇房子', aliases: [] },
  { key: 'purchasedCount', name: '已購買戶數', aliases: ['已購買富宇房子', '已購買戶數', '購買戶數', '第幾戶'] },
  { key: 'introducerName', name: '介紹人姓名', aliases: ['介紹人姓名', '介紹人'] },
  { key: 'introducerPhone', name: '介紹人電話', aliases: ['介紹人電話'] },
  { key: 'emergencyName', name: '緊急聯絡人', aliases: ['緊急聯絡人', '緊急聯絡人姓名'] },
  { key: 'emergencyPhone', name: '緊急聯絡人電話', aliases: ['緊急聯絡人電話'] },
  { key: 'emergencyRelation', name: '關係', aliases: ['關係', '緊急聯絡人關係', '與本人關係'] },
  { key: 'situation', name: '客戶情況', aliases: ['客戶情況', '客戶狀況'], multiline: true },
  { key: 'remarks', name: '備註', aliases: ['備註', '備注'], multiline: true },
  // 系統資料為權威來源：預設直接取「銷售人員管理／銷控戶別」，可手動改為表單欄位或固定文字
  { key: 'projectManager', name: '專案經理', aliases: ['專案經理'], smartDefault: 'salesManager', smartPriority: 'beforeField' },
  { key: 'salesPerson', name: '銷售人員', aliases: ['銷售人員', '業務', '業務人員', '銷售'], smartDefault: 'unitSalesperson', smartPriority: 'beforeField' },
];

/** 客戶資料卡 HTML（A4 直式，794px @96dpi） */
const buildCustomerCardHtml = (v: Record<string, string>): string => {
  const cellL = 'border:1px solid #000;padding:6px 8px;text-align:center;vertical-align:middle;';
  const cellV = 'border:1px solid #000;padding:6px 8px;text-align:center;vertical-align:middle;';
  const inline = 'border:1px solid #000;padding:6px 10px;text-align:left;vertical-align:middle;';
  return `
<div style="width:794px;min-height:1123px;background:#fff;box-sizing:border-box;padding:48px 56px;font-family:'PMingLiU','MingLiU','Noto Serif TC',serif;color:#000;font-size:14px;line-height:1.5;">
  <div style="text-align:center;font-size:24px;font-weight:bold;letter-spacing:10px;text-decoration:underline;text-underline-offset:6px;margin-bottom:18px;">客戶資料卡</div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;">
    <div>案名：　${esc(v.caseName)}　　　　戶別：　${esc(v.unitId)}</div>
    <div>${esc(v.date)}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    <colgroup>
      <col style="width:14%"><col style="width:15%"><col style="width:10%"><col style="width:11%">
      <col style="width:12%"><col style="width:19%"><col style="width:19%">
    </colgroup>
    <tr>
      <td style="${cellL}">客戶姓名</td><td style="${cellV}">${esc(v.customerName)}</td>
      <td style="${cellL}">年齡</td><td style="${cellV}">${esc(v.age)}</td>
      <td style="${cellL}">性別</td><td style="${cellV}">${esc(v.gender)}</td>
      <td style="${cellV}">${esc(v.marital)}</td>
    </tr>
    <tr>
      <td style="${cellL}">職業</td><td style="${cellV}">${esc(v.occupation)}</td>
      <td style="${cellL}">職務</td><td style="${cellV}">${esc(v.jobTitle)}</td>
      <td style="${cellL}">電話</td>
      <td colspan="2" style="border:1px solid #000;padding:4px 10px;text-align:left;vertical-align:middle;">(H) ${esc(v.phoneHome)}<br>(O) ${esc(v.phoneOffice)}</td>
    </tr>
    <tr>
      <td style="${cellL}">通訊地址</td><td colspan="3" style="${cellV}">${esc(v.address)}</td>
      <td style="${cellL}">行動電話</td><td colspan="2" style="${cellV}">${esc(v.mobile)}</td>
    </tr>
    <tr>
      <td style="${cellL}">E-mail</td><td colspan="3" style="${cellV}">${esc(v.email)}</td>
      <td style="${cellL}">專長</td><td colspan="2" style="${cellV}">${esc(v.specialty)}</td>
    </tr>
    <tr>
      <td style="${cellL}">購買動機</td><td colspan="3" style="${cellV}">${esc(v.motivation)}</td>
      <td style="${cellL}">興趣</td><td colspan="2" style="${cellV}">${esc(v.interest)}</td>
    </tr>
    <tr><td colspan="7" style="${inline}">${esc(v.purchasedLabel)}　　${esc(v.purchasedCount)}</td></tr>
    <tr><td colspan="7" style="${inline}">介紹人姓名：　${esc(v.introducerName)}　　　　電話：　${esc(v.introducerPhone)}</td></tr>
    <tr><td colspan="7" style="${inline}">緊急聯絡人：　${esc(v.emergencyName)}　　　電話：　${esc(v.emergencyPhone)}　　　關係　${esc(v.emergencyRelation)}</td></tr>
    <tr>
      <td style="${cellL}height:340px;letter-spacing:4px;">客<br>戶<br>情<br>況</td>
      <td colspan="6" style="border:1px solid #000;padding:8px 10px;text-align:left;vertical-align:top;white-space:pre-wrap;">${escBr(v.situation)}</td>
    </tr>
    <tr>
      <td style="${cellL}height:90px;">備註</td>
      <td colspan="6" style="border:1px solid #000;padding:8px 10px;text-align:left;vertical-align:top;white-space:pre-wrap;">${escBr(v.remarks)}</td>
    </tr>
  </table>
  <div style="margin-top:24px;text-align:center;">
    專案經理:　${esc(v.projectManager)}　　　　　　銷售人員：　${esc(v.salesPerson)}
  </div>
</div>`;
};

/** 客戶資料卡 Word (docx) */
const buildCustomerCardDocx = (v: Record<string, string>): Document => {
  const FONT = { name: 'PMingLiU', eastAsia: 'PMingLiU' } as any;
  const run = (text: string, opts: any = {}) =>
    new TextRun({ text: text ?? '', font: FONT, size: 22, ...opts });

  // 多行文字 → 多個 Paragraph
  const paras = (text: string, align: any = AlignmentType.LEFT) => {
    const lines = String(text ?? '').split('\n');
    return lines.map(line => new Paragraph({ alignment: align, children: [run(line)] }));
  };

  const cell = (text: string, opts: { span?: number; align?: any; lines?: Paragraph[] } = {}) =>
    new TableCell({
      columnSpan: opts.span,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: opts.lines || [new Paragraph({ alignment: opts.align ?? AlignmentType.CENTER, children: [run(text)] })],
    });

  const leftCell = (text: string, span?: number) =>
    cell(text, { span, align: AlignmentType.LEFT });

  const topCell = (text: string, span: number) =>
    new TableCell({
      columnSpan: span,
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: paras(text),
    });

  const rows: TableRow[] = [
    new TableRow({
      children: [
        cell('客戶姓名'), cell(v.customerName), cell('年齡'), cell(v.age),
        cell('性別'), cell(v.gender), cell(v.marital),
      ],
    }),
    new TableRow({
      children: [
        cell('職業'), cell(v.occupation), cell('職務'), cell(v.jobTitle), cell('電話'),
        cell('', { span: 2, lines: paras(`(H) ${v.phoneHome || ''}\n(O) ${v.phoneOffice || ''}`) }),
      ],
    }),
    new TableRow({
      children: [
        cell('通訊地址'), cell(v.address, { span: 3 }),
        cell('行動電話'), cell(v.mobile, { span: 2 }),
      ],
    }),
    new TableRow({
      children: [
        cell('E-mail'), cell(v.email, { span: 3 }),
        cell('專長'), cell(v.specialty, { span: 2 }),
      ],
    }),
    new TableRow({
      children: [
        cell('購買動機'), cell(v.motivation, { span: 3 }),
        cell('興趣'), cell(v.interest, { span: 2 }),
      ],
    }),
    new TableRow({ children: [leftCell(`${v.purchasedLabel || ''}　　${v.purchasedCount || ''}`, 7)] }),
    new TableRow({ children: [leftCell(`介紹人姓名：　${v.introducerName || ''}　　　　電話：　${v.introducerPhone || ''}`, 7)] }),
    new TableRow({ children: [leftCell(`緊急聯絡人：　${v.emergencyName || ''}　　　電話：　${v.emergencyPhone || ''}　　　關係　${v.emergencyRelation || ''}`, 7)] }),
    new TableRow({
      height: { value: 5200, rule: HeightRule.ATLEAST },
      children: [cell('客\n戶\n情\n況', { lines: paras('客\n戶\n情\n況', AlignmentType.CENTER) }), topCell(v.situation, 6)],
    }),
    new TableRow({
      height: { value: 1400, rule: HeightRule.ATLEAST },
      children: [cell('備註'), topCell(v.remarks, 6)],
    }),
  ];

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({
            text: '客 戶 資 料 卡', bold: true, size: 36, underline: {}, font: FONT,
          })],
        }),
        new Paragraph({
          tabStops: [{ type: 'right' as any, position: 9600 }],
          spacing: { after: 150 },
          children: [
            run(`案名：　${v.caseName || ''}　　　　戶別：　${v.unitId || ''}`),
            new TextRun({ text: `\t${v.date || ''}`, font: FONT, size: 22 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [1330, 1420, 950, 1040, 1140, 1800, 1800],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6 },
            bottom: { style: BorderStyle.SINGLE, size: 6 },
            left: { style: BorderStyle.SINGLE, size: 6 },
            right: { style: BorderStyle.SINGLE, size: 6 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4 },
            insideVertical: { style: BorderStyle.SINGLE, size: 4 },
          },
          rows,
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [run(`專案經理:　${v.projectManager || ''}　　　　　　銷售人員：　${v.salesPerson || ''}`)],
        }),
      ],
    }],
  });
};

export const customerCardTemplate: FormExportTemplate = {
  key: 'customerCard',
  name: '客戶資料卡',
  description: '單筆客戶資料卡（案名／戶別／客戶基本資料／客戶情況／備註），可匯出 PDF 或 Word。',
  slots: CUSTOMER_CARD_SLOTS,
  buildHtml: buildCustomerCardHtml,
  buildDocx: buildCustomerCardDocx,
  fileName: (v) => `${v.caseName || ''}${v.unitId || ''}-${v.customerName || '未填姓名'}-客戶資料卡`,
};

/** 模板註冊表（未來新增模板時在此加入） */
export const formExportTemplates: FormExportTemplate[] = [
  customerCardTemplate,
];

export { Packer };
