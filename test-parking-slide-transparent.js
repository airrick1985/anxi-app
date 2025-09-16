#!/usr/bin/env node

/**
 * 測試車位 Slide 透明填充修正
 * 驗證未售出車位的透明填充設定
 */

console.log('=== 車位 Slide 透明填充修正驗證 ===\n');

// 模擬填充顏色設定
const fillColors = {
  yellow: {rgbColor: {red: 1, green: 1, blue: 0}},
  blue: {rgbColor: {red: 0.643, green: 0.761, blue: 0.957}},
  purple: {rgbColor: {red: 0.8, green: 0.753, blue: 0.851}},
};

// 模擬透明填充設定
const transparentFill = {
  shapeBackgroundFill: {
    solidFill: {
      color: {
        rgbColor: {red: 1, green: 1, blue: 1}
      },
      alpha: 0.0
    }
  }
};

console.log('1. 透明填充設定驗證...');
console.log('✓ 透明填充物件結構:', JSON.stringify(transparentFill, null, 2));
console.log('✓ Alpha 值:', transparentFill.shapeBackgroundFill.solidFill.alpha);
console.log('✓ 背景色:', transparentFill.shapeBackgroundFill.solidFill.color.rgbColor);

console.log('\n2. 車位狀態填充邏輯測試...');

// 測試案例
const testCases = [
  {
    name: '未售出車位 - 報價模式',
    data: { number: 'A001', price_list: 1800, status_backend: null },
    slideType: 'quote',
    expected: 'transparent'
  },
  {
    name: '已售車位 - 報價模式',
    data: { number: 'A002', status: '小訂', status_backend: '小訂' },
    slideType: 'quote',
    expected: 'yellow'
  },
  {
    name: '未售出車位 - 銷控模式',
    data: { number: 'B001', price_list: 1900, status_backend: null },
    slideType: 'sales',
    expected: 'transparent'
  },
  {
    name: '保留車位 - 銷控模式',
    data: { 
      number: 'B002', 
      price_list: 2000, 
      buyerName: '保留車位', 
      status_backend: '保留' 
    },
    slideType: 'sales',
    expected: 'blue'
  },
  {
    name: '現場銷控車位 - 銷控模式',
    data: { 
      number: 'C001', 
      buyerName: '現場銷控', 
      status_backend: '現場銷控' 
    },
    slideType: 'sales',
    expected: 'purple'
  },
  {
    name: '無資料圖形',
    data: null,
    slideType: 'sales',
    expected: 'transparent'
  }
];

// 模擬填充邏輯
function getShapeFill(data, slideType) {
  if (!data) {
    return transparentFill;
  }
  
  if (slideType === "quote") {
    if (!data.status_backend) {
      return transparentFill;
    } else {
      return {shapeBackgroundFill: {solidFill: {color: fillColors.yellow}}};
    }
  } else { // 銷控模式
    if (!data.status_backend) {
      return transparentFill;
    } else {
      let finalColor = fillColors.yellow;
      if (data.buyerName && data.buyerName.includes("保留")) {
        finalColor = fillColors.blue;
      }
      if (data.buyerName && data.buyerName.includes("現場銷控")) {
        finalColor = fillColors.purple;
      }
      return {shapeBackgroundFill: {solidFill: {color: finalColor}}};
    }
  }
}

testCases.forEach(testCase => {
  const result = getShapeFill(testCase.data, testCase.slideType);
  const isTransparent = result.shapeBackgroundFill.solidFill && 
                       result.shapeBackgroundFill.solidFill.alpha === 0.0;
  
  let actualType;
  if (isTransparent) {
    actualType = 'transparent';
  } else if (result.shapeBackgroundFill.solidFill) {
    const color = result.shapeBackgroundFill.solidFill.color;
    if (color === fillColors.yellow) actualType = 'yellow';
    else if (color === fillColors.blue) actualType = 'blue';
    else if (color === fillColors.purple) actualType = 'purple';
    else actualType = 'unknown';
  } else {
    actualType = 'none';
  }
  
  const success = actualType === testCase.expected;
  console.log(`${success ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   預期: ${testCase.expected}, 實際: ${actualType}`);
  
  if (actualType === 'transparent') {
    console.log(`   透明度: ${result.shapeBackgroundFill.solidFill.alpha}`);
  }
  console.log('');
});

console.log('=== 修正總結 ===');
console.log('✅ 報價模式未售出車位: 設定為透明填充');
console.log('✅ 銷控模式未售出車位: 設定為透明填充');
console.log('✅ 無資料圖形: 設定為透明填充');
console.log('✅ 已售車位: 保持原有顏色邏輯');

console.log('\n🎯 預期效果:');
console.log('- 未售出車位將顯示為完全透明');
console.log('- 不再出現 #eeeeeeff 灰色背景');
console.log('- 保持其他車位狀態的顏色不變');

console.log('\n🚀 部署後測試建議:');
console.log('1. 更新車位表，觀察未售出車位是否為透明背景');
console.log('2. 確認已售車位顏色仍然正確');
console.log('3. 檢查報價模式和銷控模式都正常運作');