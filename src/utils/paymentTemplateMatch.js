/**
 * 期款方式範本條件比對（報價單設定 QuoteItem 與 製作付款表 PaymentSchedulePreviewDialog 共用）
 *
 * 比對規則對齊 api.selectApplicableTemplates：
 *  - 物件類型須相同（範本/戶別缺欄位皆視為「住家」）
 *  - minPrice 空/0 視為無下限、maxPrice 空/0 視為無上限
 *  - buyerType（首購/非首購）須相同（範本缺欄位視為「非首購」）
 */

/**
 * @typedef {Object} MatchCondition
 * @property {string} propertyType 此戶物件類型（住家/店面…）
 * @property {number} totalPrice   比對基準金額（萬）
 * @property {string} buyerType    '首購' | '非首購'
 */

/**
 * 回傳範本不符合條件的原因清單（空陣列 = 符合條件）
 * @param {Object} template
 * @param {MatchCondition} cond
 * @returns {{ key: 'propertyType'|'price'|'buyerType', text: string }[]}
 */
export function getTemplateMismatchReasons(template, cond) {
    if (!template) return [];
    const reasons = [];
    const propertyType = cond.propertyType || '住家';
    const templatePropType = template.propertyType || '住家';
    if (templatePropType !== propertyType) {
        reasons.push({ key: 'propertyType', text: `物件類型不符（此戶：${propertyType}）` });
    }
    const min = Number(template.minPrice) || 0;
    const max = Number(template.maxPrice) || Infinity;
    const totalPrice = Number(cond.totalPrice) || 0;
    if (totalPrice < min || totalPrice > max) {
        reasons.push({ key: 'price', text: `總價不符（此戶：${totalPrice.toLocaleString()}萬）` });
    }
    const buyerType = cond.buyerType || '非首購';
    const templateBuyerType = template.buyerType || '非首購';
    if (templateBuyerType !== buyerType) {
        reasons.push({ key: 'buyerType', text: `限${templateBuyerType}（此戶：${buyerType}）` });
    }
    return reasons;
}

/** 範本是否符合條件 */
export function isTemplateMatched(template, cond) {
    return getTemplateMismatchReasons(template, cond).length === 0;
}

/** 原因清單 → 顯示文字 */
export function joinReasonTexts(reasons) {
    return (reasons || []).map(r => r.text).join('、');
}

/** 範本的總價區間顯示文字 */
export function formatTemplatePriceRange(t) {
    if (!t.minPrice && !t.maxPrice) return '不限總價';
    const min = t.minPrice ? `${Number(t.minPrice).toLocaleString()}萬` : '0';
    const max = t.maxPrice ? `${Number(t.maxPrice).toLocaleString()}萬` : '無上限';
    return `${min}~${max}`;
}

/**
 * 建立期款方式選單項目：依「符合條件 / 條件外」分兩組（各附小標題），
 * 每個選項帶結構化資料供 PaymentTemplateOptionItem 呈現。
 *
 * 注意：呼叫端 v-select 需設 item-title="templateName" item-value="id"；
 * 分組標題項目同時提供 templateName 與 props.title，否則 Vuetify 會顯示 [object Object]。
 *
 * @param {Object[]} templates 該類別下的範本
 * @param {MatchCondition & { unlocked?: boolean, autoTemplateId?: string|null }} opts
 * @returns {Object[]} v-select items（含 subheader / divider）
 */
export function buildTemplateOptionList(templates, opts) {
    const unlocked = !!opts.unlocked;
    const autoTemplateId = opts.autoTemplateId || null;

    const toOption = (t) => {
        const reasons = getTemplateMismatchReasons(t, opts);
        const disabled = reasons.length > 0 && !unlocked;
        return {
            id: t.id,
            templateName: t.templateName,
            propertyType: t.propertyType || '住家',
            buyerType: t.buyerType || '非首購',
            priceRange: formatTemplatePriceRange(t),
            itemCount: Array.isArray(t.items) ? t.items.length : 0,
            reasons,
            reasonText: joinReasonTexts(reasons),
            badKeys: reasons.map(r => r.key),
            disabled,
            isAuto: !!autoTemplateId && t.id === autoTemplateId,
            props: { disabled }
        };
    };

    const eligible = [];
    const mismatched = [];
    (templates || []).forEach(t => {
        const option = toOption(t);
        (option.reasons.length === 0 ? eligible : mismatched).push(option);
    });

    const subheader = (title, cls) => ({
        type: 'subheader',
        templateName: title,
        props: { title, class: `tpl-group-header ${cls}` }
    });

    const list = [];
    if (eligible.length) {
        list.push(subheader(`符合此戶條件（${eligible.length}）`, 'tpl-group-ok'));
        list.push(...eligible);
    }
    if (mismatched.length) {
        if (eligible.length) list.push({ type: 'divider' });
        list.push(unlocked
            ? subheader(`條件外・已解鎖可選（${mismatched.length}）`, 'tpl-group-unlocked')
            : subheader(`條件外・不可選（${mismatched.length}）`, 'tpl-group-bad'));
        list.push(...mismatched);
    }
    return list;
}

/** 期款方式 v-select 建議的 menu-props（加高、掛上 .tpl-menu 供全域樣式） */
export const TEMPLATE_MENU_PROPS = Object.freeze({ maxHeight: 420, contentClass: 'tpl-menu' });
