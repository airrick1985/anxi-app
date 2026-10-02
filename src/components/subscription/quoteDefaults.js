// 報價單設定預設值與新報價單產生（訂閱管理）
import { taiwanToday } from '@/utils/subscriptionPipeline';

export const DEFAULT_QUOTE_SETTINGS = {
  companyName: '安熙智慧有限公司',
  companyNameEn: 'ANXI INTELLIGENCE CO., LTD.',
  from: { contactName: 'Rick 陳經理', phone: '0980-371014', taxId: '60763998' },
  validDays: 30,
  taxRate: 0.05,
  defaultNotes: [
    '-費用已包含所有雲端服務(Firebase，LINE API..等)費用，不會因用量產生額外費用。',
    '-本報價不包含：超出報價範圍的客製化功能。',
  ].join('\n'),
  defaultItems: [
    { name: '系統維護與技術支援', desc: '系統穩定性監控與資料協助上傳、定期維護。功能操作問題諮詢與支援。', amount: 0 },
  ],
  seals: [],
  planTemplates: [],
  noteTemplates: [
    {
      name: '線上預約系統',
      content: [
        '-線上預約系統使用範圍：包含對保、驗屋、交屋期間。對保期間不計費，依第一批次驗屋啟用時間開始計費。',
        '-付款方式:第一批次客戶預約啟用時間 4個月後或全案預約系統使用完畢後付款100%。',
        '-費用已包含所有雲端服務(Firebase，LINE API..等)費用，不會因用量產生額外費用。',
        '-LINE智慧通知服務僅限5位人員使用，若需增加須加購使用額度。',
        '-本報價不包含：超出報價範圍的客製化功能。',
      ].join('\n'),
    },
  ],
};

export const DEFAULT_PLAN = [
  { label: '第1期', mode: 'percent', value: 100, base: 'activated', offset: 0, offsetUnit: 'day', fixedDate: '' },
];

const clone = (v) => JSON.parse(JSON.stringify(v));

export function mergeQuoteSettings(saved) {
  const { updatedAt, ...s } = saved || {};
  return {
    ...clone(DEFAULT_QUOTE_SETTINGS),
    ...s,
    from: { ...DEFAULT_QUOTE_SETTINGS.from, ...(s.from || {}) },
    defaultItems: s.defaultItems ? clone(s.defaultItems) : clone(DEFAULT_QUOTE_SETTINGS.defaultItems),
    seals: s.seals ? clone(s.seals) : [],
    planTemplates: s.planTemplates ? clone(s.planTemplates) : [],
    noteTemplates: s.noteTemplates ? clone(s.noteTemplates) : clone(DEFAULT_QUOTE_SETTINGS.noteTemplates),
  };
}

// 新報價：續約時沿用上一輪的品項、備註、付款條件
export function newQuote(sub, settings, prevQuote = null) {
  const billTo = sub.billTo || {};
  const base = {
    version: 1,
    pdfVersion: 0,
    date: taiwanToday(),
    validDays: settings.validDays,
    company: { name: settings.companyName, nameEn: settings.companyNameEn },
    from: { ...settings.from },
    billTo: {
      name: billTo.name || '',
      taxId: billTo.taxId || '',
      contactName: billTo.contactName || sub.contactName || '',
      phone: billTo.phone || sub.contactPhone || '',
    },
    taxRate: settings.taxRate,
  };
  if (prevQuote) {
    return {
      ...base,
      items: clone(prevQuote.items || []),
      discountedTotal: prevQuote.discountedTotal || 0,
      notes: prevQuote.notes || '',
      plan: clone(prevQuote.plan || DEFAULT_PLAN),
      images: clone(prevQuote.images || []),
    };
  }
  return {
    ...base,
    items: [
      { name: `${sub.systemFunction || ''}(${sub.projectName || ''})`, desc: '', amount: 0 },
      ...clone(settings.defaultItems || []),
    ],
    discountedTotal: 0,
    notes: settings.defaultNotes || '',
    plan: clone(settings.planTemplates?.[0]?.plan || DEFAULT_PLAN),
    images: [],
  };
}

// 檔名：{買受人}-{第一品項}-報價單-{日期}
export function quoteFileBase(quote, sub) {
  const who = quote.billTo?.name || sub.projectName || '報價';
  const what = quote.items?.[0]?.name || `${sub.systemFunction}(${sub.projectName})`;
  return `${who}-${what}-報價單-${quote.date}`.replace(/[\\/:*?"<>|]/g, '_');
}
