/**
 * 期款計算共用模組
 * 自 QuoteItem.vue 抽出，供「報價單」與「付款表產製」共用。
 * 對應 paymentTermTemplates 範本 items 的公式計算與進位規則。
 */

/**
 * 新版計算引擎：依公式與依賴關係計算各期款項目金額
 * @param {Array} templateItems - 期款範本項目列表（{ id, parentId, name, formula, roundingMethod, roundingValue }）
 * @param {number} baseValue - 基礎金額（總價或配套價）
 * @param {string} baseVariable - 基礎變數名稱（"總價" 或 "配套金額"）
 * @returns {Object} 計算結果 { [itemName]: { id, name, value, formula, parentId, error? } }
 */
export function runNewCalculationEngine(templateItems, baseValue, baseVariable) {
    if (!templateItems || templateItems.length === 0 || !baseValue) {
        return {};
    }

    const results = {};
    const calculations = {};

    // 設定基本變數
    calculations[baseVariable] = baseValue;

    // 分析項目依賴關係
    const analyzeDependencies = (items) => {
        const dependencies = new Map();
        items.forEach(item => {
            const deps = [];
            // 簡單的依賴分析：檢查公式中是否包含其他項目的名稱
            items.forEach(otherItem => {
                if (item.id !== otherItem.id && item.formula.includes(otherItem.name)) {
                    deps.push(otherItem.id);
                }
            });
            dependencies.set(item.id, deps);
        });
        return dependencies;
    };

    const dependencies = analyzeDependencies(templateItems);

    // 處理所有項目（按依賴順序）
    const processedItems = new Set();
    let maxIterations = templateItems.length * 5;

    while (processedItems.size < templateItems.length && maxIterations > 0) {
        maxIterations--;
        let progressMade = false;

        // 優先處理沒有依賴或依賴已滿足的項目
        const sortedItems = templateItems.slice().sort((a, b) => {
            const aDeps = dependencies.get(a.id) || [];
            const bDeps = dependencies.get(b.id) || [];
            const aUnmetDeps = aDeps.filter(dep => !processedItems.has(dep)).length;
            const bUnmetDeps = bDeps.filter(dep => !processedItems.has(dep)).length;
            return aUnmetDeps - bUnmetDeps;
        });

        for (const item of sortedItems) {
            if (processedItems.has(item.id)) continue;

            try {
                // 檢查是否所有依賴都已滿足
                const itemDeps = dependencies.get(item.id) || [];
                const unmetDeps = itemDeps.filter(dep => {
                    const depItem = templateItems.find(t => t.id === dep);
                    return depItem && !Object.prototype.hasOwnProperty.call(calculations, depItem.name);
                });

                if (unmetDeps.length > 0) {
                    continue;
                }

                // 嘗試計算這個項目
                const result = evaluateFormula(item.formula, calculations);

                // 應用四捨五入規則
                const roundedResult = applyNewRounding(
                    result,
                    item.roundingMethod,
                    item.roundingValue || 0
                );

                // 儲存結果
                calculations[item.name] = roundedResult;
                results[item.name] = {
                    id: item.id,
                    name: item.name,
                    value: roundedResult,
                    formula: item.formula,
                    parentId: item.parentId
                };

                processedItems.add(item.id);
                progressMade = true;

            } catch (error) {
                // 如果計算失敗，嘗試使用默認值或跳過
                if (error.message.includes('未替換的字符')) {
                    console.warn(`項目 "${item.name}" 包含無法解析的引用，使用默認值 0`);
                    calculations[item.name] = 0;
                    results[item.name] = {
                        id: item.id,
                        name: item.name,
                        value: 0,
                        formula: item.formula,
                        parentId: item.parentId,
                        error: true
                    };
                    processedItems.add(item.id);
                    progressMade = true;
                }
                continue;
            }
        }

        if (!progressMade) {
            console.warn('計算引擎沒有進展，可能存在循環依賴或無法解析的公式');
            const unprocessedItems = templateItems.filter(item => !processedItems.has(item.id));
            console.warn('未處理的項目:', unprocessedItems.map(item => ({
                name: item.name,
                formula: item.formula,
                dependencies: dependencies.get(item.id) || []
            })));

            // 對於無法處理的項目，設置為 0
            unprocessedItems.forEach(item => {
                calculations[item.name] = 0;
                results[item.name] = {
                    id: item.id,
                    name: item.name,
                    value: 0,
                    formula: item.formula,
                    parentId: item.parentId,
                    error: true
                };
                processedItems.add(item.id);
            });
            break;
        }
    }

    return results;
}

/**
 * 公式計算函數，支援項目名稱引用
 * @param {string} formula - 公式字串
 * @param {Object} variables - 可用變數 { 變數名: 值 }
 * @returns {number} 計算結果
 */
export function evaluateFormula(formula, variables) {
    let expression = String(formula).trim();

    // 如果是純數字，直接返回
    if (/^\d+(\.\d+)?$/.test(expression)) {
        return parseFloat(expression);
    }

    // 處理百分比 (例如: "5%" -> "(5/100)")
    expression = expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // 創建名稱映射表：將舊格式轉換為可能的新格式
    const createNameMapping = (availableVars) => {
        const mapping = {};
        const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                               '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

        // 為每個可用變數創建可能的舊格式映射
        availableVars.forEach(varName => {
            // 如果變數名稱以中文數字開頭，創建對應的阿拉伯數字格式
            chineseNumbers.forEach((chineseNum, index) => {
                const arabicNum = index + 1;

                // 處理 "一、" -> "1." 的映射
                if (varName.startsWith(chineseNum + '、')) {
                    const remainder = varName.substring(chineseNum.length + 1);
                    mapping[`${arabicNum}.${remainder}`] = varName;
                }

                // 處理 "一" -> "1." 的映射（如果沒有頓號）
                if (varName.startsWith(chineseNum) && !varName.includes('、')) {
                    const remainder = varName.substring(chineseNum.length);
                    mapping[`${arabicNum}.${remainder}`] = varName;
                }
            });
        });

        return mapping;
    };

    const nameMapping = createNameMapping(Object.keys(variables));

    // 改進的分詞策略：考慮中文字符和標點符號
    const operators = ['+', '-', '*', '/', '(', ')'];
    let tokens = [];
    let currentToken = '';

    // 將公式分解為標記（tokens）
    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        if (operators.includes(char)) {
            if (currentToken.trim()) {
                tokens.push(currentToken.trim());
                currentToken = '';
            }
            tokens.push(char);
        } else {
            currentToken += char;
        }
    }

    // 添加最後一個標記
    if (currentToken.trim()) {
        tokens.push(currentToken.trim());
    }

    // 排序變數名稱，從長到短，避免短變數名被包含在長變數名中
    const sortedVariableNames = Object.keys(variables).sort((a, b) => b.length - a.length);

    // 替換變數標記
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // 跳過運算符
        if (operators.includes(token)) {
            continue;
        }

        // 如果是數字，跳過
        if (/^\d+(\.\d+)?$/.test(token)) {
            continue;
        }

        // 檢查是否為變數名（使用排序後的變數名稱列表）
        let replaced = false;

        // 首先檢查直接匹配
        for (const variableName of sortedVariableNames) {
            if (token === variableName) {
                const value = variables[variableName];
                tokens[i] = `(${value})`;
                replaced = true;
                break;
            }
        }

        // 如果直接匹配失敗，檢查名稱映射
        if (!replaced && nameMapping[token]) {
            const mappedName = nameMapping[token];
            if (Object.prototype.hasOwnProperty.call(variables, mappedName)) {
                const value = variables[mappedName];
                tokens[i] = `(${value})`;
                replaced = true;
            }
        }

        if (!replaced) {
            console.warn(`找不到變數: "${token}"，暫時設為 0`);
            // 對於找不到的變數，先設為 0，讓公式能夠繼續執行
            tokens[i] = '(0)';
        }
    }

    // 重新組合表達式
    expression = tokens.join('');

    // 安全計算數學表達式
    try {
        // 檢查表達式是否只包含安全字符
        if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
            // 如果還有未替換的字符，記錄詳細信息
            const remainingChars = expression.match(/[^0-9+\-*/().%\s]+/g);
            if (remainingChars && remainingChars.length > 0) {
                console.warn('發現未替換的字符:', remainingChars, '公式:', formula);
                // 不再拋出錯誤，而是返回 0 作為默認值
                return 0;
            }
        }

        // 執行計算
        const result = Function('"use strict"; return (' + expression + ')')();

        // 檢查結果是否有效
        if (isNaN(result) || !isFinite(result)) {
            throw new Error(`計算結果無效: ${result}`);
        }

        return result;
    } catch (error) {
        console.error(`公式計算詳細錯誤:`, {
            原始公式: formula,
            處理後表達式: expression,
            錯誤訊息: error.message
        });
        throw new Error(`公式計算錯誤: ${formula} -> ${expression}: ${error.message}`);
    }
}

/**
 * 新的四捨五入規則應用
 * @param {number} value - 原始值
 * @param {string} method - 四捨五入方法（四捨五入/無條件進位/無條件捨去）
 * @param {number} roundingValue - 四捨五入精度
 * @returns {number} 四捨五入後的值
 */
export function applyNewRounding(value, method, roundingValue) {
    if (!method || method === '') return Math.round(value);

    const precision = roundingValue || 1;

    switch (method) {
        case '四捨五入':
            return Math.round(value / precision) * precision;
        case '無條件進位':
            return Math.ceil(value / precision) * precision;
        case '無條件捨去':
            return Math.floor(value / precision) * precision;
        default:
            return Math.round(value);
    }
}
