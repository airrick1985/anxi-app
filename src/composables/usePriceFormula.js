// 房土比計算公式：token 表示 + 評估引擎
//
// 公式以「token 陣列」儲存，每個 token 可能是 ref / op / paren / number：
//   { type: 'ref',    key: 'total'|'parking'|'houseRatio'|'landRatio'|'housePrice'|'landPrice' }
//   { type: 'op',     op:  '+'|'-'|'*'|'/' }
//   { type: 'paren',  value: '('|')' }
//   { type: 'number', value: 123.45 }
//
// 進位：rounding = { mode: 'round'|'ceil'|'floor', decimals: 0..3 }

// ============ 常數：特殊合約 ============
// 特殊合約（毛胚/配套等）在房土比計算時，「成交總價」改用「配套房屋總價」(price_package_deal)
// 未來擴充只需在集合中加入新的合約類型字串
export const SPECIAL_CONTRACT_TYPES = new Set(['毛胚合約', '配套合約']);

export function isSpecialContractType(contractType) {
  return SPECIAL_CONTRACT_TYPES.has(String(contractType || ''));
}

// ============ 常數：可用參照 ============

export const REF_DEFINITIONS = [
  { key: 'total',       label: '成交總價',       group: 'primary', unit: '萬' },
  { key: 'parking',     label: '車位總價',       group: 'primary', unit: '萬' },
  { key: 'houseRatio',  label: '房屋價款比例',   group: 'primary', unit: '%'  },
  { key: 'landRatio',   label: '土地價款比例',   group: 'primary', unit: '%'  },
  { key: 'housePrice',  label: '房屋價款 (結果)', group: 'result',  unit: '萬' },
  { key: 'landPrice',   label: '土地價款 (結果)', group: 'result',  unit: '萬' },
];

export const REF_MAP = Object.fromEntries(REF_DEFINITIONS.map(r => [r.key, r]));

export const OP_OPTIONS = [
  { op: '+', label: '+' },
  { op: '-', label: '−' },
  { op: '*', label: '×' },
  { op: '/', label: '÷' },
];

export const ROUNDING_MODES = [
  { value: 'round', label: '四捨五入' },
  { value: 'ceil',  label: '無條件進位' },
  { value: 'floor', label: '無條件捨去' },
];

// ============ 預設公式（使用者尚未設定時的 fallback） ============
// 預設：
//   土地價款 = (總價 - 車位) × 土地比例%，四捨五入(小數第1位)
//   房屋價款 = 總價 - 車位 - 土地價款
export function buildDefaultFormulas() {
  return {
    landPriceFormula: {
      tokens: [
        { type: 'paren', value: '(' },
        { type: 'ref', key: 'total' },
        { type: 'op', op: '-' },
        { type: 'ref', key: 'parking' },
        { type: 'paren', value: ')' },
        { type: 'op', op: '*' },
        { type: 'ref', key: 'landRatio' },
        { type: 'op', op: '/' },
        { type: 'number', value: 100 },
      ],
      rounding: { mode: 'round', decimals: 1 },
    },
    housePriceFormula: {
      tokens: [
        { type: 'ref', key: 'total' },
        { type: 'op', op: '-' },
        { type: 'ref', key: 'parking' },
        { type: 'op', op: '-' },
        { type: 'ref', key: 'landPrice' },
      ],
      rounding: { mode: 'round', decimals: 0 },
    },
  };
}

// ============ 顯示：token → 可讀字串 ============
export function formulaToDisplayString(formula) {
  if (!formula || !Array.isArray(formula.tokens) || formula.tokens.length === 0) return '(空)';
  const parts = formula.tokens.map(t => {
    if (t.type === 'ref') return `[${REF_MAP[t.key]?.label || t.key}]`;
    if (t.type === 'op') {
      const o = OP_OPTIONS.find(o => o.op === t.op);
      return o ? o.label : t.op;
    }
    if (t.type === 'paren') return t.value;
    if (t.type === 'number') return String(t.value);
    return '?';
  });
  return parts.join(' ');
}

export function roundingToDisplayString(rounding) {
  if (!rounding) return '';
  const mode = ROUNDING_MODES.find(m => m.value === rounding.mode)?.label || rounding.mode;
  return `${mode}(小數第${rounding.decimals ?? 0}位)`;
}

// ============ 評估引擎 ============
// 採 shunting-yard + RPN 計算。只支援 + - * / 與 ( )。
// context: { total, parking, houseRatio, landRatio, housePrice, landPrice }

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

function tokensToRpn(tokens) {
  const output = [];
  const ops = [];
  for (const t of tokens) {
    if (t.type === 'ref' || t.type === 'number') {
      output.push(t);
    } else if (t.type === 'op') {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.type === 'op' && PRECEDENCE[top.op] >= PRECEDENCE[t.op]) {
          output.push(ops.pop());
        } else break;
      }
      ops.push(t);
    } else if (t.type === 'paren' && t.value === '(') {
      ops.push(t);
    } else if (t.type === 'paren' && t.value === ')') {
      while (ops.length && !(ops[ops.length - 1].type === 'paren' && ops[ops.length - 1].value === '(')) {
        output.push(ops.pop());
      }
      if (!ops.length) throw new Error('括號不平衡：多出 )');
      ops.pop(); // 丟棄 '('
    }
  }
  while (ops.length) {
    const top = ops.pop();
    if (top.type === 'paren') throw new Error('括號不平衡：多出 (');
    output.push(top);
  }
  return output;
}

function evaluateRpn(rpn, context) {
  const stack = [];
  for (const t of rpn) {
    if (t.type === 'number') {
      stack.push(Number(t.value) || 0);
    } else if (t.type === 'ref') {
      const v = context[t.key];
      stack.push(Number.isFinite(v) ? Number(v) : 0);
    } else if (t.type === 'op') {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('運算元不足');
      switch (t.op) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(b === 0 ? 0 : a / b); break;
        default: throw new Error(`未知運算子 ${t.op}`);
      }
    }
  }
  if (stack.length !== 1) throw new Error('公式結構不完整');
  return stack[0];
}

function applyRounding(value, rounding) {
  if (!rounding || !Number.isFinite(value)) return value;
  const d = Math.max(0, Math.min(6, Number(rounding.decimals) || 0));
  const factor = Math.pow(10, d);
  switch (rounding.mode) {
    case 'ceil':  return Math.ceil(value * factor) / factor;
    case 'floor': return Math.floor(value * factor) / factor;
    case 'round':
    default:      return Math.round(value * factor) / factor;
  }
}

// ============ 評估單支公式（給預覽/單獨測試用） ============
// 差別於 computeHouseLandPrices：直接以呼叫端提供的 context 計算，不做依賴順序推導、
// 也不會對參照值再做進位（避免預覽時「另一支公式的結果」被二次進位）。
export function evaluateFormulaWithContext(formula, context) {
  if (!formula || !Array.isArray(formula.tokens) || formula.tokens.length === 0) return 0;
  try {
    const rpn = tokensToRpn(formula.tokens);
    const raw = evaluateRpn(rpn, context || {});
    return applyRounding(raw, formula.rounding);
  } catch (e) {
    return NaN;
  }
}

// 驗證 tokens 結構合理性（未 commit 時前端也可呼叫以開關儲存鈕）
// 回傳 { valid: boolean, message: string }
export function validateFormula(formula) {
  if (!formula || !Array.isArray(formula.tokens)) return { valid: false, message: '公式為空' };
  if (formula.tokens.length === 0) return { valid: false, message: '公式為空' };
  try {
    const rpn = tokensToRpn(formula.tokens);
    // 用測試 context 跑一次，檢查結構
    evaluateRpn(rpn, { total: 1, parking: 1, houseRatio: 1, landRatio: 1, housePrice: 1, landPrice: 1 });
    return { valid: true, message: '' };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

// ============ 高階 API：計算戶別的房屋/土地價款（萬） ============
// unitData: 戶別資料（含 price_transaction_total / price_transaction_house / 持有車位 / housePriceRatio / landPriceRatio）
// formulaSettings: { housePriceFormula, landPriceFormula }（無則採預設）
//
// 兩公式可能互相依賴。解法：先在不帶對方結果的情況下計算一次，
// 若某公式依賴對方結果，則先算不依賴的那支，再算另一支。
// 若兩者都相互依賴（循環），回傳 { housePrice: NaN, landPrice: NaN, error: '...' }。
export function computeHouseLandPrices(unitData, formulaSettings) {
  const settings = formulaSettings && (formulaSettings.housePriceFormula || formulaSettings.landPriceFormula)
    ? formulaSettings
    : buildDefaultFormulas();

  const house = settings.housePriceFormula || buildDefaultFormulas().housePriceFormula;
  const land  = settings.landPriceFormula  || buildDefaultFormulas().landPriceFormula;

  // 基礎 context
  // 特殊合約（毛胚/配套）：total 改以「配套房屋總價」(price_package_deal) 作為房土比計算基礎
  const total       = isSpecialContractType(unitData?.contractType)
    ? (Number(unitData?.price_package_deal) || 0)
    : (Number(unitData?.price_transaction_total) || 0);
  const parking     = Array.isArray(unitData?.['持有車位'])
    ? unitData['持有車位'].reduce((s, p) => s + (Number(p?.['車位成交價']) || 0), 0)
    : 0;
  const houseRatio  = Number(unitData?.housePriceRatio) || 0;
  const landRatio   = Number(unitData?.landPriceRatio)  || 0;

  const baseCtx = { total, parking, houseRatio, landRatio, housePrice: 0, landPrice: 0 };

  const housDep = usesRef(house, 'landPrice');
  const landDep = usesRef(land, 'housePrice');

  let housePrice = 0;
  let landPrice = 0;

  try {
    if (housDep && landDep) {
      return { housePrice: NaN, landPrice: NaN, error: '房屋/土地公式互相參照，無法計算' };
    } else if (housDep && !landDep) {
      // 先算 land，再算 house
      landPrice  = applyRounding(evaluateRpn(tokensToRpn(land.tokens), baseCtx), land.rounding);
      housePrice = applyRounding(evaluateRpn(tokensToRpn(house.tokens), { ...baseCtx, landPrice }), house.rounding);
    } else if (!housDep && landDep) {
      housePrice = applyRounding(evaluateRpn(tokensToRpn(house.tokens), baseCtx), house.rounding);
      landPrice  = applyRounding(evaluateRpn(tokensToRpn(land.tokens), { ...baseCtx, housePrice }), land.rounding);
    } else {
      housePrice = applyRounding(evaluateRpn(tokensToRpn(house.tokens), baseCtx), house.rounding);
      landPrice  = applyRounding(evaluateRpn(tokensToRpn(land.tokens), baseCtx), land.rounding);
    }
  } catch (e) {
    return { housePrice: NaN, landPrice: NaN, error: e.message };
  }

  return { housePrice, landPrice, error: '' };
}

function usesRef(formula, key) {
  if (!formula || !Array.isArray(formula.tokens)) return false;
  return formula.tokens.some(t => t.type === 'ref' && t.key === key);
}

// 給前端偵錯：一次輸出 context + 結果（除錯時可用）
export function debugCompute(unitData, formulaSettings) {
  const r = computeHouseLandPrices(unitData, formulaSettings);
  const ctx = {
    total: isSpecialContractType(unitData?.contractType)
      ? (Number(unitData?.price_package_deal) || 0)
      : (Number(unitData?.price_transaction_total) || 0),
    parking: Array.isArray(unitData?.['持有車位'])
      ? unitData['持有車位'].reduce((s, p) => s + (Number(p?.['車位成交價']) || 0), 0)
      : 0,
    houseRatio: Number(unitData?.housePriceRatio) || 0,
    landRatio:  Number(unitData?.landPriceRatio)  || 0,
    isSpecial: isSpecialContractType(unitData?.contractType),
  };
  return { context: ctx, result: r };
}
