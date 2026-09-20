import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { applyPrintSetup, NARROW_MARGINS } from '../../src/services/xlsxPrintSetup.js';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { combineCommissionGrids } from '../../src/utils/commissionExportGrouping.js';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { buildBonusModel, exportProjectNameOf } = await server.ssrLoadModule('/src/utils/commissionExportModel.js');
  const XLSX = await import('xlsx-js-style');
  const calc = await server.ssrLoadModule('/src/utils/commissionCalculation.js');
  const service = fs.readFileSync(new URL('../../src/services/commissionExcelService.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export (async )?function/g, '$1function');
  const { buildBonusGrids, gridsToExcelBlob } = vm.runInNewContext(`${service}\n({ buildBonusGrids, gridsToExcelBlob })`,
    { XLSX: XLSX.default, toNum: calc.toNum, money: calc.money, applyPrintSetup, NARROW_MARGINS });
  const settings = { bonusCategories: [{ key: 'sales', label: '個獎', mode: 'individual', enabled: true, ratePct: 1 }] };
  const records = [
    { id: 'general1', unitId: 'A-1', planId: 'general', ratioPct: 100 },
    { id: 'package1', unitId: 'A-1', planId: 'package', ratioPct: 100 },
    { id: 'refund1', unitId: 'A-1', planId: 'general', ratioPct: -100, type: 'refund' },
  ];
  const bonusRecords = records.map((r, i) => ({
    commissionRecordId: r.id, unitId: r.unitId, personKey: '0912345678', name: '王小明',
    amounts: { sales: [1000, 200, -100][i] }, subtotal: [1000, 200, -100][i],
  }));
  test('同戶一般、配套及退佣各列只計入自己的獎金', () => {
    const model = buildBonusModel({ records, bonusRecords, settings, period: 1 });
    const group = model.groups[0];
    assert.deepEqual(group.unitRows.map(r => r.pp['0912345678'].indiv), [1000, 200, -100]);
    assert.equal(group.topTotal.pp['0912345678'].indiv, 1100);
    assert.equal(group.right[0].sub, 1100);
  });
  test('合併工作表保留方案標題、資料、合併儲存格，Excel 可讀回單一 Sheet', async () => {
    const grids = records.slice(0, 2).flatMap((r, i) => buildBonusGrids(buildBonusModel({
      records: [r], bonusRecords: [bonusRecords[i]], settings, period: 1, projectName: i ? '配套請佣' : '一般請佣',
    })));
    const before = JSON.stringify(grids);
    const merged = combineCommissionGrids(grids, '合併獎金表');
    assert.equal(merged.nRows, grids[0].nRows + grids[1].nRows + 1);
    assert.equal(merged.merges[grids[0].merges.length].r1, grids[1].merges[0].r1 + grids[0].nRows + 1);
    assert.equal(JSON.stringify(grids), before);
    const blob = await gridsToExcelBlob([merged]);
    const workbook = XLSX.default.read(await blob.arrayBuffer(), { type: 'array' });
    assert.deepEqual(workbook.SheetNames, ['合併獎金表']);
    const rows = XLSX.default.utils.sheet_to_json(workbook.Sheets['合併獎金表'], { header: 1 });
    assert.ok(rows.some(r => String(r[0]).includes('一般請佣')));
    assert.ok(rows.some(r => String(r[0]).includes('配套請佣')));
  });
  test('改名後一般及配套報表呈現新名稱，預設一般方案沿用既有檔名', () => {
    assert.equal(exportProjectNameOf('甲建案', { id: 'general', name: '一般請佣' }), '甲建案');
    assert.equal(exportProjectNameOf('甲建案', { id: 'general', name: '房屋服務費' }), '甲建案・房屋服務費');
    assert.equal(exportProjectNameOf('甲建案', { id: 'package', name: '裝修服務費' }), '甲建案・裝修服務費');
  });
  test('沒有可匯出資料時不建立空白合併工作表', () => {
    assert.equal(combineCommissionGrids([], '獎金'), null);
  });
} finally {
  await server.close();
}
