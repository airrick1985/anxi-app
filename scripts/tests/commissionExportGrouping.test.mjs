import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const { buildBonusPdf } = createRequire(import.meta.url)('../../functions/commissionDocument.js');
import { applyPrintSetup, NARROW_MARGINS } from '../../src/services/xlsxPrintSetup.js';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { summarizePeriodBonus, bonusSourceRecords, periodPersonNotes } from '../../src/utils/commissionPeriodBonus.js';
import { combineCommissionGrids } from '../../src/utils/commissionExportGrouping.js';

const server = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { buildBonusModel, buildMergedBonusModel, buildPersonModel, exportProjectNameOf } = await server.ssrLoadModule('/src/utils/commissionExportModel.js');
  const XLSX = await import('xlsx-js-style');
  const calc = await server.ssrLoadModule('/src/utils/commissionCalculation.js');
  const service = fs.readFileSync(new URL('../../src/services/commissionExcelService.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export (async )?function/g, '$1function');
  const { buildBonusGrids, buildPersonGrid, buildPersonExcelGrids, gridsToExcelBlob } = vm.runInNewContext(`${service}\n({ buildBonusGrids, buildPersonGrid, buildPersonExcelGrids, gridsToExcelBlob })`,
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
  test('一般七列加配套兩列連號，隔離同名類別並共用預覽與 Excel 資料', async () => {
    const sources = ['general', 'package'].map((id, index) => ({
      plan: { id, name: index ? '配套請佣' : '一般請佣', priceBasis: index ? 'package' : 'house' },
      settings: { bonusCategories: [{ key: 'sales', label: index ? '團獎' : '個獎', mode: index ? 'team' : 'individual', ratePct: index ? 2 : 1 }] },
      records: Array.from({ length: index ? 2 : 7 }, (_, i) => ({
        id: `record${i}`, unitId: `A-${i + 1}`, ratioPct: 100,
        snapshot: { houseDeal: index ? 300 : 2000, houseFloor: 250, parkingSpots: 'P1' },
      })),
      bonusRecords: Array.from({ length: index ? 2 : 7 }, (_, i) => ({
        commissionRecordId: `record${i}`, personKey: 'p', name: '王小明',
        amounts: { sales: index ? 200 : 100 }, subtotal: index ? 200 : 100, keep: 10, tax: 5, nhi: 2,
      })),
    }));
    const before = JSON.stringify(sources);
    const model = buildMergedBonusModel({ sources, projectName: '測試', period: 1 });
    const group = model.groups[0];
    assert.equal(model.groups.length, 1);
    assert.deepEqual(group.unitRows.map(r => r.no), [1,2,3,4,5,6,7,8,9]);
    assert.equal(group.unitRows[7].planName, '配套請佣');
    assert.deepEqual(group.unitRows[0].pp.p, { indiv: 100, team: 0 });
    assert.deepEqual(group.unitRows[7].pp.p, { indiv: 0, team: 200 });
    assert.deepEqual(group.topTotal.pp.p, { indiv: 700, team: 400 });
    assert.equal(group.right[0].sub, 1100);
    assert.equal(group.grand.net, 947);
    assert.equal(JSON.stringify(sources), before);
    const grids = buildBonusGrids(model);
    assert.equal(grids.length, 1);
    assert.equal(grids[0].unitRows.length, 9);
    const pdf = await buildBonusPdf({ grids, paper: model.paper, orientation: model.orientation });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    const blob = await gridsToExcelBlob(grids);
    const workbook = XLSX.default.read(await blob.arrayBuffer(), { type: 'array' });
    assert.equal(workbook.SheetNames.length, 1);
    const rows = XLSX.default.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    const data = rows.filter(r => typeof r[0] === 'number');
    assert.deepEqual(data.map(r => r[0]), [1,2,3,4,5,6,7,8,9]);
    assert.equal(data[0][4], 'P1');
    assert.equal(data[7][4], 250);
    assert.equal(data[7][6], 300);
    assert.match(data[7][3], /配套請佣/);
    sources[1].records[0].ratioPct = -50;
    sources[1].bonusRecords[0].amounts = { sales: -100 };
    sources[1].bonusRecords[0].amountsFull = { sales: -200 };
    const split = buildMergedBonusModel({ sources, period: 1 });
    assert.deepEqual(split.groups.map(g => g.pctKey), ['100', '50']);
    assert.equal(split.groups[1].unitRows[0].pp.p.team, -200);
    assert.equal(buildMergedBonusModel({ sources: [] }).groups.length, 0);
  });
  test('跨方案當期合計排除作廢，修改草稿取代原筆，跨期移動不重複', () => {
    const saved = [
      { commissionRecordId: 'g', period: 1, personKey: 'p', name: '人員', net: 100, subtotal: 100 },
      { commissionRecordId: 'p', period: 1, personKey: 'p', name: '人員', net: 200, subtotal: 200 },
      { commissionRecordId: 'void', period: 1, personKey: 'p', net: 999, status: 'voided' },
      { commissionRecordId: 'next', period: 2, personKey: 'p', net: 888 },
    ];
    assert.equal(summarizePeriodBonus({ period: 1, saved }).totals.net, 300);
    const drafts = [{ period: 1, personKey: 'p', name: '人員', net: 150 }];
    assert.equal(summarizePeriodBonus({ period: 1, saved, drafts, replacingIds: ['g'] }).totals.net, 350);
    drafts[0].period = 2;
    assert.equal(summarizePeriodBonus({ period: 1, saved, drafts, replacingIds: ['g'] }).totals.net, 200);
    assert.equal(bonusSourceRecords([{ id: 'g', status: 'voided' }], [{ id: 'new', status: 'active' }], saved)[0].status, 'active');
  });
  test('當期備註未存時帶入同人最近一期備註；存過空陣列或有舊紀錄備註時不帶入', () => {
    const notes = [
      { period: 1, personKey: 'p', notes: ['第一期'] },
      { period: 3, personKey: 'p', notes: ['第三期'] },
      { period: 2, personKey: 'q', notes: ['別人的'] },
      { period: 4, personKey: 'p', notes: [] },
    ];
    assert.deepEqual(periodPersonNotes(notes, 3, 'p'), ['第三期']);
    assert.deepEqual(periodPersonNotes(notes, 5, 'p'), []);   // 最近一期（第 4 期）已刻意清空
    assert.deepEqual(periodPersonNotes(notes, 2, 'p'), ['第一期']);
    assert.deepEqual(periodPersonNotes(notes, 4, 'p'), []);
    assert.deepEqual(periodPersonNotes(notes, 2, 'p', ['舊紀錄']), ['舊紀錄']);
    assert.deepEqual(periodPersonNotes(notes, 1, 'q'), []);
    assert.deepEqual(periodPersonNotes(notes, 6, 'r'), []);
  });
  test('多列當期備註完整呈現於獎金表、個人明細、Excel及PDF，清空後不恢復舊備註', async () => {
    const notes = Array.from({ length: 65 }, (_, i) => `備註${i + 1}：當期說明`);
    const periodNotes = [{ period: 1, personKey: '0912345678', notes }];
    const br = bonusRecords.slice(0, 1).map(b => ({ ...b, period: 1, remark: '舊戶別備註' }));
    const opts = { records: records.slice(0, 1), bonusRecords: br, settings, periodNotes, period: 1 };
    const bonus = buildBonusModel(opts);
    const person = buildPersonModel({ ...opts, periods: [1], personKey: '0912345678' });
    const grids = [...buildBonusGrids(bonus), buildPersonGrid(person), ...buildPersonExcelGrids(person)];
    for (const grid of grids) {
      const values = grid.cells.flat().filter(Boolean).map(c => String(c.v));
      notes.forEach(note => assert.ok(values.some(v => v.includes(note)), note));
    }
    const blob = await gridsToExcelBlob(grids);
    const wb = XLSX.default.read(await blob.arrayBuffer(), { type: 'array' });
    for (const name of wb.SheetNames) {
      const text = JSON.stringify(XLSX.default.utils.sheet_to_json(wb.Sheets[name], { header: 1 }));
      notes.forEach(note => assert.ok(text.includes(note)));
    }
    const pdf = await buildBonusPdf({ grids: grids.slice(0, 2), paper: 'A4', orientation: 'landscape' });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length > 2, 'many notes must paginate');
    periodNotes[0].notes = [];
    assert.deepEqual(buildBonusModel(opts).groups[0].right[0].remarkNotes, []);
    assert.deepEqual(buildPersonModel({ ...opts, periods: [1], personKey: '0912345678' }).periodRemarks, []);
  });
  test('沒有可匯出資料時不建立空白合併工作表', () => {
    assert.equal(combineCommissionGrids([], '獎金'), null);
  });
} finally {
  await server.close();
}
