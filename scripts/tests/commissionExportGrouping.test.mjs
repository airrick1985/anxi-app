import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const { buildBonusPdf } = createRequire(import.meta.url)('../../functions/commissionDocument.js');
import { applyPrintSetup, NARROW_MARGINS } from '../../src/services/xlsxPrintSetup.js';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { createServer } from 'vite';
import { summarizePeriodBonus, bonusSourceRecords, periodPersonNotes } from '../../src/utils/commissionPeriodBonus.js';
import { combineCommissionGrids } from '../../src/utils/commissionExportGrouping.js';

const server = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { buildBonusModel, buildMergedBonusModel, buildPersonModel, buildPeriodResultModel, buildPeriodUnitModel, makePersonSorter, exportProjectNameOf } = await server.ssrLoadModule('/src/utils/commissionExportModel.js');
  const XLSX = await import('xlsx-js-style');
  const calc = await server.ssrLoadModule('/src/utils/commissionCalculation.js');
  const { draftClaimRecord } = await server.ssrLoadModule('/src/utils/commissionDraftRecords.js');
  const service = fs.readFileSync(new URL('../../src/services/commissionExcelService.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export (async )?function/g, '$1function');
  const { buildBonusGrids, buildPeriodResultGrid, buildPeriodUnitGrid, buildPersonGrid, buildPersonExcelGrids, gridsToExcelBlob } = vm.runInNewContext(`${service}\n({ buildBonusGrids, buildPeriodResultGrid, buildPeriodUnitGrid, buildPersonGrid, buildPersonExcelGrids, gridsToExcelBlob })`,
    { XLSX: XLSX.default, toNum: calc.toNum, money: calc.money, pctText: calc.pctText, applyPrintSetup, NARROW_MARGINS });
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
  test('獎金表每戶列出個獎／團獎費率，不再有千4標籤列', () => {
    const rs = { bonusCategories: [
      { key: 'indiv', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 0.32 },
      { key: 'team', label: '銷售團獎', mode: 'team', enabled: true, ratePct: 0.08 },
    ] };
    const recs = [
      { id: 'u1', unitId: 'A-1', ratioPct: 100, categories: { indiv: { ratePct: 0.3 }, team: { ratePct: 0.1 } } },
      { id: 'u2', unitId: 'A-2', ratioPct: 100, categories: {} },
    ];
    const br = recs.map(r => ({ commissionRecordId: r.id, personKey: '甲', name: '甲', amounts: { indiv: 300, team: 100 }, subtotal: 400 }));
    const group = buildBonusModel({ records: recs, bonusRecords: br, settings: rs, period: 1 }).groups[0];
    const grid = buildBonusGrids({ groups: [group], style: {} })[0];
    assert.deepEqual([grid.cells[1][15].v, grid.cells[1][16].v], ['個獎費率', '團獎費率']);
    assert.deepEqual(Array.from(grid.cells.slice(3, 5), r => `${r[15].v}/${r[16].v}`), ['0.3%/0.1%', '0.32%/0.08%']);
    assert.equal(grid.cells[1][17].v, '甲');
    assert.ok(!grid.cells.flat().some(c => c?.v === '千4'));
  });
  test('獎金表上方在團獎費率右邊列出交屋保留款費率（標示基準）與 100% 金額；無提撥不顯示', () => {
    const rs = { bonusCategories: [
      { key: 'indiv', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 1 },
      { key: 'team', label: '銷售團獎', mode: 'team', enabled: true, ratePct: 0.5 },
      { key: 'handover', label: '交屋團獎', mode: 'handover', enabled: true, ratePct: 5, sourceCatKey: 'indiv' },
    ] };
    const recs = [
      { id: 'u1', unitId: 'A-1', ratioPct: 50, categories: { indiv: { label: '銷售個獎', ratePct: 1 } },
        handover: { total: 2500, totalFull: 5000, byCat: { handover: { sourceCatKey: 'indiv', ratePct: 5, amount: 2500, amountFull: 5000 } } } },
      { id: 'u2', unitId: 'A-2', ratioPct: 50, categories: {} },
    ];
    const br = recs.map(r => ({ commissionRecordId: r.id, personKey: '甲', name: '甲', amounts: { indiv: 50000 }, amountsFull: { indiv: 100000 }, subtotal: 50000 }));
    const group = buildBonusModel({ records: recs, bonusRecords: br, settings: rs, period: 1 }).groups[0];
    const grid = buildBonusGrids({ groups: [group], style: {} })[0];
    assert.deepEqual([grid.cells[1][17].v, grid.cells[1][18].v], ['交屋保留款費率', '交屋保留款金額']);
    assert.deepEqual([grid.cells[3][17].v, grid.cells[3][18].v], ['銷售個獎 5%', 5000]);
    assert.equal(grid.cells[5][18].v, 5000);
    assert.equal(grid.cells[1][19].v, '甲');
    const plain = buildBonusModel({ records: [recs[1]], bonusRecords: [br[1]], settings: rs, period: 1 }).groups[0];
    assert.equal(buildBonusGrids({ groups: [plain], style: {} })[0].cells[1][17].v, '甲');
  });
  test('獎金表上方在團獎人數與個獎費率之間列出獎金比例，退佣顯示負值', () => {
    const recs = [
      { id: 'u1', unitId: 'A-1', ratioPct: 50 },
      { id: 'u2', unitId: 'A-2', ratioPct: -50, type: 'refund' },
    ];
    const br = recs.map(r => ({ commissionRecordId: r.id, personKey: '甲', name: '甲', amounts: { sales: r.ratioPct * 10 }, subtotal: r.ratioPct * 10 }));
    const grid = buildBonusGrids(buildBonusModel({ records: recs, bonusRecords: br, settings, period: 1 }))[0];
    assert.deepEqual([grid.cells[1][13].v, grid.cells[1][14].v, grid.cells[1][15].v], ['團獎人數', '獎金比例', '個獎費率']);
    assert.deepEqual([grid.cells[3][14].v, grid.cells[4][14].v], ['50%', '-50%']);
  });
  test('統整一頁：各比例戶別同一頁、全部以實際金額呈現，不列優付列', () => {
    const recs = [
      { id: 'u1', unitId: 'A-1', ratioPct: 100 },
      { id: 'u2', unitId: 'A-2', ratioPct: 50 },
      { id: 'u3', unitId: 'A-3', ratioPct: 25,
        handover: { byCat: { handover: { sourceCatKey: 'sales', ratePct: 5, amount: 250, amountFull: 1000 } } } },
    ];
    const br = [
      { commissionRecordId: 'u1', personKey: '甲', name: '甲', amounts: { sales: 1000 }, subtotal: 1000, keep: 100, tax: 90, nhi: 19 },
      { commissionRecordId: 'u2', personKey: '甲', name: '甲', amounts: { sales: 500 }, amountsFull: { sales: 1000 }, subtotal: 500, keep: 50, tax: 45, nhi: 9 },
      { commissionRecordId: 'u3', personKey: '甲', name: '甲', amounts: { sales: 250 }, amountsFull: { sales: 1000 }, subtotal: 250, keep: 25, tax: 22, nhi: 4 },
    ];
    const model = buildBonusModel({ records: recs, bonusRecords: br, settings, period: 3, projectName: '甲建案', singlePage: true });
    assert.equal(model.groups.length, 1);
    const group = model.groups[0];
    assert.equal(group.isYoufu, false);
    assert.equal(group.sheetName, '業務獎金');
    assert.equal(group.title, '甲建案－業務獎金　第 3 期');
    assert.deepEqual(group.unitRows.map(r => [r.no, r.ratioPct, r.pp['甲'].indiv]), [[1, 100, 1000], [2, 50, 500], [3, 25, 250]]);
    assert.equal(group.unitRows[2].hkAmt, 250);
    assert.equal(group.topTotal.pp['甲'].indiv, 1750);
    const a = group.right[0];
    assert.deepEqual([a.sub, a.keep, a.tax, a.nhi, a.net], [1750, 175, 157, 32, 1386]);
    assert.deepEqual(group.grand, { net: 1386, tax: 157, nhi: 32, total: 1575 });
    const grid = buildBonusGrids(model)[0];
    const labels = grid.cells.map(r => r[0]?.v).filter(v => typeof v === 'string');
    assert.ok(!labels.some(v => v.includes('優付')));
    assert.ok(labels.includes('累計'));
    assert.deepEqual(Array.from(grid.cells.slice(3, 6), r => r[14].v), ['100%', '50%', '25%']);
    // 依比例分頁維持原樣：三頁、非 100% 頁以 100% 呈現
    const paged = buildBonusModel({ records: recs, bonusRecords: br, settings, period: 3 });
    assert.deepEqual(paged.groups.map(g => g.pctKey), ['100', '50', '25']);
    assert.equal(paged.groups[1].unitRows[0].pp['甲'].indiv, 1000);
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
    const single = buildMergedBonusModel({ sources, projectName: '測試', period: 1, singlePage: true });
    assert.equal(single.groups.length, 1);
    assert.equal(single.groups[0].sheetName, '合併獎金');
    assert.equal(single.groups[0].title, '測試－合併獎金表　第 1 期');
    assert.equal(single.groups[0].unitRows.find(r => r.ratioPct === -50).pp.p.team, -100);
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
  test('交屋團獎（交屋保留款）不扣個獎池，前後端計算一致', () => {
    const finance = { dealTotal: 2000, totalFloor: 2000, spread: 0 };
    const input = { ratioPct: 100, commPct: 2, categories: {
      sales: { ratePct: 0.3, mode: 'individual', allocations: [{ personKey: '甲', name: '甲', sharePct: 100 }] },
      handover: { ratePct: 5, mode: 'handover', sourceCatKey: 'sales', allocations: [] },
    } };
    const serverCalc = createRequire(import.meta.url)('../../functions/utils/commissionCalculation.js');
    for (const res of [calc.calcUnitBonus(finance, input, {}), serverCalc.calcUnitBonus(finance, input, {})]) {
      assert.equal(res.people[0].amounts.sales, 60000);
      assert.equal(res.people[0].subtotal, 60000);
      assert.equal(res.handoverTotal, 3000);
    }
  });
  test('工作台計算→存檔紀錄→獎金表：項目欄在前、一人一欄、全員無金額的列不呈現、稅金以合計(扣保留款)為基礎', () => {
    const finance = { dealTotal: 2000, totalFloor: 2000, spread: 0 };
    const entry = { id: 'u1', unitId: 'A-1', period: 1, ratioPct: 100, commPct: 2, keepPct: 10, finance, unit: {}, categories: {
      chair: { ratePct: 0.04, mode: 'role', allocations: [{ personKey: '王', name: '王', sharePct: 100 }] },
      indiv: { ratePct: 0.24, mode: 'individual', allocations: [{ personKey: '林', name: '林', sharePct: 100 }] },
      team: { ratePct: 0.06, mode: 'team', allocations: [{ personKey: '王', name: '王', sharePct: 50 }, { personKey: '林', name: '林', sharePct: 50 }] },
      handover: { ratePct: 5, mode: 'handover', sourceCatKey: 'indiv', allocations: [] },
    } };
    const result = calc.calcUnitBonus(finance, entry, {
      王: { name: '王', role: '主委', keepPct: 10, taxPct: 0, nhiPct: 0 },
      林: { name: '林', keepPct: 10, taxPct: 10, nhiPct: 0 },
    });
    const { record, bonusRecords: br } = draftClaimRecord({ entry, result, projectId: 'p', planId: 'general', plan: { name: '一般' } });
    const hs = { bonusCategories: [
      { key: 'chair', label: '主委獎金', mode: 'role', rolePositions: ['主委'], enabled: true, ratePct: 0.04 },
      { key: 'proj', label: '專案獎金', mode: 'role', rolePositions: ['專案'], enabled: true, ratePct: 0.08 },
      { key: 'indiv', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 0.24 },
      { key: 'team', label: '銷售團獎', mode: 'team', enabled: true, ratePct: 0.06 },
      { key: 'handover', label: '交屋團獎', mode: 'handover', sourceCatKey: 'indiv', enabled: true, ratePct: 5 },
    ] };
    const group = buildBonusModel({ records: [record], bonusRecords: br, settings: hs, period: 1 }).groups[0];
    const grid = buildBonusGrids({ groups: [group], style: {} })[0];
    const rowIdx = label => grid.cells.length - 1 - [...grid.cells].reverse().findIndex(r => r?.some(c => c?.v === label));
    const row = label => Array.from(grid.cells[rowIdx(label)].filter(c => typeof c?.v === 'number'), c => c.v);
    const head = grid.cells[rowIdx('項目')];
    assert.deepEqual(Array.from(head.filter(c => c?.v), c => c.v), ['項目', '王', '林']);
    assert.deepEqual(group.topPersons.map(p => p.name).sort(), ['林', '王']);
    assert.ok(!grid.cells.flat().some(c => ['銷售日期', '實發'].includes(c?.v) || String(c?.v ?? '').startsWith('總銷')));
    const labels = ['銷售個獎 0.24%', '銷售團獎 0.06%', '主委獎金 0.04%', '累計', '保留款　10%', '合計(扣保留款)', '稅金', '最終實領', '交屋保留款'];
    assert.deepEqual(labels.map(rowIdx), labels.map((_, i) => rowIdx(labels[0]) + i));   // 依序相鄰
    assert.deepEqual(Object.fromEntries(labels.map(l => [l, row(l)])), {
      '銷售個獎 0.24%': [48000], '銷售團獎 0.06%': [6000, 6000], '主委獎金 0.04%': [8000],
      累計: [14000, 54000], '保留款　10%': [1400, 5400], '合計(扣保留款)': [12600, 48600],
      稅金: [4860], 最終實領: [12600, 43740], 交屋保留款: [2400],
    });
    assert.ok(grid.cells[rowIdx('交屋保留款')].every(c => c?.s?.bg === '#fde2e2' && c?.s?.color === '#000000'));
    assert.deepEqual(row('最終實領合計'), [56340]);
    const texts = grid.cells.flat().map(c => String(c?.v ?? ''));
    assert.ok(!texts.some(t => t.startsWith('專案獎金') || t === '二代健保' || t === '備註'));
    assert.equal(rowIdx('最終實領合計'), rowIdx('交屋保留款') + 1);
  });
  test('獎金合計：交屋保留款列於最終實領下方，僅供參考不參與計算', () => {
    const hs = { bonusCategories: [
      { key: 'sales', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 0.3 },
      { key: 'handover', label: '交屋團獎', mode: 'handover', sourceCatKey: 'sales', enabled: true, ratePct: 5 },
    ] };
    const rec = { id: 'h1', unitId: 'B-2', ratioPct: 100, handover: { total: 90, byCat: { handover: { sourceCatKey: 'sales', amount: 90, amountFull: 90 } } } };
    const br = [['甲', 1200], ['乙', 600]].map(([name, v]) => ({
      commissionRecordId: 'h1', personKey: name, name, amounts: { sales: v }, subtotal: v, keep: v / 10, tax: 0, nhi: 0,
    }));
    const group = buildBonusModel({ records: [rec], bonusRecords: br, settings: hs, period: 1 }).groups[0];
    const grid = buildBonusGrids({ groups: [group], style: {} })[0];
    const LABEL = '交屋保留款';
    const rowOf = label => grid.cells.findIndex(row => row?.some(c => c?.v === label));
    const vals = r => Array.from(grid.cells[r].filter(c => typeof c?.v === 'number'), c => c.v);
    const byName = m => group.right.map(a => m[a.name]);
    assert.ok(!grid.cells.flat().some(c => String(c?.v ?? '').includes('暫留不發放')));
    assert.deepEqual(vals(rowOf('累計')), byName({ 甲: 1200, 乙: 600 }));
    assert.deepEqual(vals(rowOf('最終實領')), byName({ 甲: 1080, 乙: 540 }));
    assert.ok(grid.cells[rowOf('最終實領')].every(c => c?.s?.bg === '#ffff00'));   // 同合計列底色（預設黃色）
    const hRow = rowOf(LABEL);
    assert.equal(hRow, rowOf('最終實領') + 1);
    assert.deepEqual(vals(hRow), byName({ 甲: 60, 乙: 30 }));
    assert.ok(grid.cells[hRow].every(c => c?.s?.bg === '#fde2e2'));

    // 優付（請佣 50%）：交屋保留款以實際金額
    const half = { ...rec, ratioPct: 50, handover: { total: 45, byCat: { handover: { sourceCatKey: 'sales', amount: 45, amountFull: 90 } } } };
    const hbr = br.map(b => ({ ...b, amounts: { sales: b.amounts.sales / 2 }, amountsFull: b.amounts, subtotal: b.subtotal / 2, keep: b.keep / 2 }));
    const yGrid = buildBonusGrids({ groups: buildBonusModel({ records: [half], bonusRecords: hbr, settings: hs, period: 1 }).groups, style: {} })[0];
    const yRow = yGrid.cells.findIndex(row => row?.some(c => c?.v === LABEL));
    assert.deepEqual(Array.from(yGrid.cells[yRow].filter(c => typeof c?.v === 'number'), c => c.v), byName({ 甲: 30, 乙: 15 }));

    const merged = buildMergedBonusModel({ sources: [{ plan: { id: 'general', name: '一般' }, records: [rec], bonusRecords: br, settings: hs, unitOrder: [] }], settings: {}, period: 1 });
    assert.deepEqual(merged.groups[0].right.map(a => a.handoverKeep), byName({ 甲: 60, 乙: 30 }));
    const plain = buildBonusGrids(buildBonusModel({ records: [{ ...rec, handover: undefined }], bonusRecords: br, settings, period: 1 }))[0];
    assert.ok(!plain.cells.some(row => row?.some(c => c?.v === LABEL)));
  });
  test('個人明細：交屋保留款費率／金額（本人為該戶銷售人員才有）、期別彙總與保留款累計', () => {
    const hs = { bonusCategories: [
      { key: 'sales', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 0.3 },
      { key: 'pm', label: '專案獎金', mode: 'role', rolePositions: ['專案'], enabled: true, ratePct: 0.1 },
      { key: 'handover', label: '交屋團獎', mode: 'handover', sourceCatKey: 'sales', enabled: true, ratePct: 5 },
    ] };
    const hk = (amount, ratePct = 5) => ({ byCat: { handover: { sourceCatKey: 'sales', ratePct, amount, amountFull: amount } } });
    const recs = [
      { id: 'a', unitId: 'A-1', period: 1, ratioPct: 100, handover: hk(90), snapshot: { salesperson: ['甲', '乙'] } },
      { id: 'b', unitId: 'A-2', period: 2, ratioPct: 50, handover: hk(20), snapshot: { salesperson: ['甲'] } },
      { id: 'c', unitId: 'A-3', period: 2, ratioPct: 100, handover: hk(0, 0), snapshot: { salesperson: ['甲'] } },
    ];
    const br = [
      ['a', 1, '甲', { sales: 1200 }], ['a', 1, '乙', { sales: 600 }], ['a', 1, '丙', { pm: 300 }],
      ['b', 2, '甲', { sales: 400 }], ['c', 2, '甲', { sales: 500 }],
    ].map(([id, period, name, amounts]) => ({
      commissionRecordId: id, period, personKey: name, name, amounts,
      subtotal: Object.values(amounts)[0], keep: Object.values(amounts)[0] / 10,
    }));
    const opts = { records: recs, bonusRecords: br, settings: hs };
    const me = buildPersonModel({ ...opts, periods: [1, 2], personKey: '甲' });
    assert.deepEqual(me.rows.map(r => [r.unit, r.hkRate, r.hk]), [['A-1', '銷售個獎 5%', 60], ['A-2', '銷售個獎 5%', 20], ['A-3', '', 0]]);
    assert.equal(me.totals.hk, 80);
    assert.deepEqual(me.periodSummaries.map(p => p.hk), [60, 20]);
    assert.equal(buildPersonModel({ ...opts, periods: [2], personKey: '甲' }).retention.hkTotal, 80);   // 累計含全部期別

    const grid = buildPersonGrid(me);
    const cells = grid.cells.flat().filter(Boolean);
    assert.ok(cells.some(c => c.v === '※ 保留款中含交屋保留款 80 元'), '重點區附註交屋保留款');
    const rowOf = v => grid.cells.findIndex(row => row?.some(c => c?.v === v));
    const hkCol = grid.cells[rowOf('其中交屋保留款')].findIndex(c => c?.v === '其中交屋保留款');
    assert.equal(grid.cells[rowOf('其中交屋保留款') + 1][hkCol].v, 80);
    assert.equal(grid.print.orientation, 'portrait');
    assert.ok(cells.some(c => /^[一二三四]、期別彙總$/.test(c.v)), '多期列期別彙總');

    // 非本戶銷售人員（只領專案獎金）：欄位仍顯示，金額 0、費率空白
    const pm = buildPersonModel({ ...opts, periods: [1], personKey: '丙' });
    assert.deepEqual(pm.rows.map(r => [r.hkRate, r.hk]), [['', 0]]);
    assert.equal(pm.retention.hkTotal, 0);
    const pmGrid = buildPersonGrid(pm);
    assert.ok(!pmGrid.cells.flat().some(c => c?.v === '其中交屋保留款'), '無交屋保留款不列');
    assert.ok(!pmGrid.cells.flat().some(c => String(c?.v).includes('期別彙總')), '單期不列期別彙總');
    assert.equal(buildPersonExcelGrids(pm).length, 1);
  });
  test('個人明細：各類別本人分配比例列於金額下方，分配類別（含只有本人）依相同名單合併列出戶別與全部人員比例', async () => {
    const ss = { bonusCategories: [
      { key: 'sales', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 1, order: 1 },
      { key: 'team', label: '銷售團獎', mode: 'team', enabled: true, ratePct: 0.5, order: 2 },
      { key: 'apm', label: '副專獎金', mode: 'role', rolePositions: ['副專'], enabled: true, ratePct: 0.05, order: 3 },
    ] };
    const pct = (personKey, sharePct) => ({ personKey, name: personKey, mode: 'pct', sharePct });
    const team4 = { allocations: ['甲', '乙', '丙', '丁'].map(k => pct(k, 25)) };
    const recs = [
      { id: 'u1', unitId: 'A-1', period: 1, ratioPct: 100, snapshot: { salesperson: ['甲'] }, categories: { sales: { allocations: [pct('甲', 100)] }, team: team4 } },
      { id: 'u2', unitId: 'A-2', period: 1, ratioPct: 100, snapshot: { salesperson: ['甲'] }, categories: { team: team4 } },
      { id: 'u3', unitId: 'B-1', period: 1, ratioPct: 100, snapshot: { salesperson: ['乙'] }, categories: {
        team: { allocations: [pct('乙', 50), pct('甲', 50)] },
        apm: { allocations: [{ personKey: '甲', name: '甲', mode: 'locked', lockedAmount: 300 }, pct('庚', 100)] } } },
      { id: 'u4', unitId: 'B-2', period: 1, ratioPct: 100, snapshot: { salesperson: ['乙'] }, categories: {
        apm: { allocMode: 'each', allocations: [pct('甲', 50), pct('庚', 50)] } } },
      { id: 'u5', unitId: 'C-1', period: 1, ratioPct: 100, snapshot: { salesperson: ['甲'] }, categories: {} },
    ];
    const row = (id, personKey, amounts) => ({ commissionRecordId: id, period: 1, unitId: recs.find(r => r.id === id).unitId, personKey, name: personKey, amounts,
      subtotal: Object.values(amounts).reduce((a, b) => a + b, 0) });
    const br = [
      row('u1', '甲', { sales: 1000, team: 100 }), ...['乙', '丙', '丁'].map(k => row('u1', k, { team: 100 })),
      row('u2', '甲', { team: 80 }), ...['乙', '丙', '丁'].map(k => row('u2', k, { team: 80 })),
      row('u3', '乙', { team: 60 }), row('u3', '甲', { team: 60, apm: 300 }), row('u3', '庚', { apm: 700 }),
      row('u4', '甲', { apm: 500 }), row('u4', '庚', { apm: 500 }),
      row('u5', '甲', { team: 200 }), row('u5', '乙', { team: 600 }),
    ];
    const me = buildPersonModel({ records: recs, bonusRecords: br, settings: ss, periods: [1], personKey: '甲', projectName: '測試' });
    assert.deepEqual(me.rows.find(r => r.unit === 'A-1').shares, { sales: { pct: 100, locked: false }, team: { pct: 25, locked: false } });
    assert.deepEqual(me.rows.find(r => r.unit === 'B-1').shares.apm, { pct: 30, locked: true });
    assert.deepEqual(me.allocations.map(a => [a.label, a.units.join('、'), a.count, a.own.pct, a.persons.map(p => `${p.name}${p.self ? '*' : ''}${p.pct}${p.locked ? 'L' : ''}`).join(' ')]), [
      ['銷售個獎', 'A-1', 1, 100, '甲*100'],
      ['銷售團獎', 'A-1、A-2', 2, 25, '甲*25 乙25 丙25 丁25'],
      ['銷售團獎', 'B-1', 1, 50, '乙50 甲*50'],
      ['銷售團獎', 'C-1', 1, 25, '甲*25 乙75'],
      ['副專獎金', 'B-1', 1, 30, '甲*30L 庚70'],
      ['副專獎金', 'B-2', 1, 100, '甲*100 庚100'],
    ]);
    const grid = buildPersonGrid(me);
    const texts = grid.cells.flat().filter(Boolean).map(c => c.v);
    assert.ok(texts.includes('本人分配比例'));
    assert.ok(texts.some(v => String(v).startsWith('二、獎金分配比例')));
    assert.ok(texts.includes('甲(本人) 25%、乙 25%、丙 25%、丁 25%'));
    assert.ok(texts.includes('甲(本人) 30%(鎖定)、庚 70%'));
    assert.ok(texts.some(v => String(v).startsWith('三、保留款累計')));
    const shareRow = grid.cells.find(r => r?.[0]?.v === '本人分配比例');
    assert.deepEqual(Array.from(shareRow.filter(c => /%/.test(c?.v ?? '')), c => c.v), ['100%', '25%']);
    assert.deepEqual(Array.from(buildPersonExcelGrids(me), g => g.name), ['甲']);
    const blob = await gridsToExcelBlob(buildPersonExcelGrids(me));
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    assert.match(await zip.file('xl/worksheets/sheet1.xml').async('string'), /orientation="portrait" fitToWidth="1" fitToHeight="0"/);

    // 很多人分：名單分列（續），不撐寬表格；PDF 可產出
    const many = Array.from({ length: 60 }, (_, i) => `業務人員${String(i + 1).padStart(2, '0')}`);
    const bigRecs = [{ id: 'm1', unitId: 'D-1', period: 1, ratioPct: 100, snapshot: { salesperson: ['甲'] },
      categories: { team: { allocations: ['甲', ...many].map((k, i, all) => pct(k, i === all.length - 1 ? 100 - 1.63 * (all.length - 1) : 1.63)) } } }];
    const bigBr = ['甲', ...many].map(k => ({ commissionRecordId: 'm1', period: 1, unitId: 'D-1', personKey: k, name: k, amounts: { team: 10 }, subtotal: 10 }));
    const big = buildPersonModel({ records: bigRecs, bonusRecords: bigBr, settings: ss, periods: [1], personKey: '甲', projectName: '測試' });
    const bigGrid = buildPersonGrid(big);
    assert.equal(bigGrid.nCols, buildPersonGrid({ ...big, allocations: [] }).nCols);
    const cont = bigGrid.cells.filter(r => r?.[0]?.v === '銷售團獎（續）');
    assert.ok(cont.length >= 1);
    const listed = bigGrid.cells.filter(r => String(r?.[0]?.v || '').startsWith('銷售團獎')).flatMap(r => r.filter(c => /業務人員|\(本人\)/.test(c?.v ?? '')).map(c => c.v));
    assert.equal(listed.join('、').split('、').length, 61);
    const pdf = await buildBonusPdf({ grids: [bigGrid], paper: 'A4', orientation: 'portrait' });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  });
  test('個人明細依戶別：指定戶別跨期別逐戶列出（期別、月份、簽約日），不限本人銷售；沒有所選戶別獎金者照樣產出', async () => {
    const ss = { bonusCategories: [
      { key: 'sales', label: '銷售個獎', mode: 'individual', enabled: true, ratePct: 1, order: 1 },
      { key: 'pm', label: '專案獎金', mode: 'role', rolePositions: ['專案'], enabled: true, ratePct: 0.13, order: 2 },
    ] };
    const solo = key => ({ [key]: { allocations: [{ personKey: '甲', name: '甲', mode: 'pct', sharePct: 100 }] } });
    const c16 = { unitId: 'C-16', ratioPct: 50, snapshot: { salesperson: ['乙'], buyerName: '林小姐', contractDate: '2026/08/01' }, categories: solo('pm') };
    const recs = [
      { id: 'a9', period: 9, requestDate: '2026/10/18', ...c16 },
      { id: 'a8', period: 8, requestDate: '2026/09/15', ...c16 },
      { id: 'b9', unitId: 'F-18', period: 9, ratioPct: 100, requestDate: '2026/10/18', snapshot: { salesperson: ['甲'], buyerName: '陳先生', contractDate: '2026/09/02' }, categories: solo('sales') },
      { id: 'c9', unitId: 'A-01', period: 9, ratioPct: 100, requestDate: '2026/10/18', snapshot: { salesperson: ['乙'] }, categories: solo('pm') },
    ];
    const row = (id, amounts) => {
      const r = recs.find(x => x.id === id);
      const subtotal = Object.values(amounts).reduce((a, b) => a + b, 0);
      return { commissionRecordId: id, period: r.period, unitId: r.unitId, requestDate: r.requestDate, personKey: '甲', name: '甲', amounts,
        subtotal, keep: subtotal / 10, tax: 0, nhi: 0, net: subtotal * 0.9, keepPct: 10, taxPct: 0, nhiPct: 0 };
    };
    const br = [row('a9', { pm: 23920 }), row('a8', { pm: 23920 }), row('b9', { sales: 1000 }), row('c9', { pm: 5000 })];
    const opts = { records: recs, bonusRecords: br, settings: ss, periods: [9], unitIds: ['F-18', 'C-16'], projectName: '測試' };
    const me = buildPersonModel({ ...opts, personKey: '甲' });
    assert.deepEqual([me.unitMode, me.subtitle, me.periods], [true, '指定戶別 2 戶', [8, 9]]);
    assert.deepEqual(me.rows.map(r => [r.unit, r.period, r.month, r.contractDate]),
      [['C-16', 8, '115/09', '115/8/1'], ['C-16', 9, '115/10', '115/8/1'], ['F-18', 9, '115/10', '115/9/2']]);
    assert.deepEqual([me.detailRows.length, me.otherAggregate, me.totals.subtotal], [3, null, 48840]);
    assert.deepEqual(me.allocations.map(a => [a.label, a.units.join('、'), a.own.pct]), [['銷售個獎', 'F-18', 100], ['專案獎金', 'C-16', 100]]);
    assert.match(me.fileName, /戶別獎金明細-甲$/);

    const grid = buildPersonGrid(me);
    const texts = grid.cells.flat().filter(Boolean).map(c => c.v);
    assert.ok(texts.includes('所選戶別合計（2 戶）'));
    assert.ok(['戶別', '期別', '月份', '簽約日'].every(h => texts.includes(h)));
    assert.ok(!texts.some(v => /^第 \d+ 期/.test(String(v))));
    const pdf = await buildBonusPdf({ grids: [grid], paper: 'A4', orientation: 'portrait' });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');

    const none = buildPersonModel({ ...opts, unitIds: ['Z-99'], personKey: '甲' });
    assert.deepEqual([none.rows.length, none.totals.net, none.showDetail], [0, 0, false]);
    assert.ok(buildPersonGrid(none).cells.flat().some(c => c?.v === '所選戶別合計（1 戶）'));
  });
  test('每人當期獎金結果：與工作台同資料（跨方案、排除作廢、草稿取代原筆），每類別一欄、扣款比例不一致顯示依戶別', async () => {
    const b = (id, planId, period, personKey, amounts, extra = {}) => {
      const subtotal = Object.values(amounts).reduce((x, y) => x + y, 0);
      return { commissionRecordId: id, planId, period, personKey, name: personKey, amounts, subtotal,
        keep: subtotal / 10, tax: 0, nhi: 0, net: subtotal * 0.9, keepPct: 10, taxPct: 0, nhiPct: 0, requestDate: '2026-10-01', ...extra };
    };
    const saved = [
      b('g1', 'general', 3, '甲', { sales: 1000, team: 200 }),
      b('p1', 'package', 3, '甲', { pkg: 500 }, { keepPct: 5, keep: 25, net: 475 }),
      b('g2', 'general', 3, '乙', { team: 200, apm: 300 }, { remark: '舊備註' }),
      b('g3', 'general', 3, '乙', { team: 999 }, { status: 'voided' }),
      b('g4', 'general', 2, '乙', { team: 777 }),
      b('g5', 'general', 3, '丙', { apm: 100 }),
    ];
    const drafts = [b('g5x', 'general', 3, '丙', { apm: 150 })];
    const model = buildPeriodResultModel({
      period: 3, saved, drafts, replacingIds: ['g5'],
      categoryLabels: { sales: '銷售個獎', team: '銷售團獎', apm: '副專獎金', pkg: '配套獎金' },
      categoryOrder: ['apm', 'sales', 'team'],
      sorter: makePersonSorter([], ['甲', '乙', '丙']),
      periodNotes: [{ period: 3, personKey: '甲', notes: ['第一行', '第二行'] }],
      projectName: '測試建案', style: {},
    });
    assert.deepEqual(model.categories.map(c => c.label), ['副專獎金', '銷售個獎', '銷售團獎', '配套獎金']);
    assert.deepEqual(model.people.map(p => [p.name, p.subtotal, p.byCat.apm, p.byCat.pkg]), [['乙', 500, 300, 0], ['丙', 150, 150, 0], ['甲', 1700, 0, 500]]);
    assert.deepEqual(model.people.map(p => p.keepPct), [10, 10, null]);
    assert.deepEqual(model.people.map(p => p.notes), [['舊備註'], [], ['第一行', '第二行']]);
    assert.equal(model.totals.subtotal, 2350);
    assert.equal(model.totals.byCat.team, 400);
    assert.equal(model.title, '測試建案－每人當期獎金結果　第 3 期（115 年 10 月）');

    const grid = buildPeriodResultGrid(model);
    assert.deepEqual(Array.from(grid.cells[1], c => c.v), ['人員', '副專獎金', '銷售個獎', '銷售團獎', '配套獎金', '保留款％', '稅金％', '二代健保％', '小計', '保留款', '稅金', '二代健保', '實發', '當期備註']);
    assert.deepEqual(Array.from(grid.cells[4], c => c.v).slice(0, 9), ['甲', '', 1000, 200, 500, '依戶別', '0%', '0%', 1700]);
    assert.equal(grid.cells[4][13].v, '第一行\n第二行');
    assert.deepEqual(Array.from(grid.cells[5], c => c.v).slice(0, 5), ['合計', 450, 1000, 400, 500]);
    assert.equal(grid.cells[5][8].v, 2350);
    const workbook = XLSX.default.read(await (await gridsToExcelBlob([grid])).arrayBuffer(), { type: 'array' });
    assert.deepEqual(workbook.SheetNames, ['每人當期獎金結果']);
    const pdf = await buildBonusPdf({ grids: [grid], paper: 'A3', orientation: 'landscape' });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    const empty = buildPeriodResultGrid(buildPeriodResultModel({ period: 9, saved, projectName: '測試建案' }));
    assert.equal(empty.cells[2][0].v, '本期尚無獎金資料');
  });
  test('每人當期獎金結果：表頭標註類別比例（依戶別紀錄，不同比例拆欄），交屋保留款比例與金額標在該銷售人員', () => {
    const b = (id, recId, personKey, amounts) => {
      const subtotal = Object.values(amounts).reduce((x, y) => x + y, 0);
      return { commissionRecordId: recId, id, period: 4, personKey, name: personKey, amounts, subtotal,
        keep: subtotal / 10, tax: 0, nhi: 0, net: subtotal * 0.9, keepPct: 10, taxPct: 0, nhiPct: 0, requestDate: '2026-10-01' };
    };
    const records = [
      { id: 'r1', categories: { indiv: { label: '銷售個獎', ratePct: 0.32 }, team: { ratePct: 0.08 } },
        handover: { byCat: { handover: { sourceCatKey: 'indiv', ratePct: 5, amount: 300 } } } },
      { id: 'r2', categories: { indiv: { label: '銷售個獎', ratePct: 0.3 }, team: { ratePct: 0.08 } },
        handover: { byCat: { handover: { sourceCatKey: 'indiv', ratePct: 5, amount: 100 } } } },
      { id: 'rf', type: 'refund', categories: {}, sourceRecordIds: ['r0'] },
      { id: 'r0', categories: { indiv: { ratePct: 0.3 } } },
    ];
    const saved = [
      b('a', 'r1', '甲', { indiv: 2000, team: 100 }),
      b('b', 'r1', '乙', { indiv: 1000, team: 100 }),
      b('c', 'r2', '甲', { indiv: 2000, apm: 50 }),
      b('d', 'rf', '乙', { indiv: -500 }),
    ];
    const model = buildPeriodResultModel({
      period: 4, saved, records,
      categoryLabels: { indiv: '銷售個獎', team: '銷售團獎', apm: '副專獎金' },
      categoryRates: { indiv: 0.32, team: 0.08, apm: 0.05 },
      categoryOrder: ['apm', 'indiv', 'team'], indivKeys: ['indiv'],
      sorter: makePersonSorter([], ['甲', '乙']), projectName: '測試建案',
    });
    // 同類別不同比例拆欄（由高到低）；退佣紀錄沒有類別時看原紀錄比例；紀錄都沒有時沿用設定
    assert.deepEqual(model.categories.map(c => [c.key, c.label, c.rateText]),
      [['apm', '副專獎金', '0.05%'], ['indiv@0.32', '銷售個獎', '0.32%'], ['indiv@0.3', '銷售個獎', '0.3%'], ['team', '銷售團獎', '0.08%']]);
    assert.deepEqual(model.people.map(p => [p.name, p.byCat['indiv@0.32'], p.byCat['indiv@0.3']]), [['甲', 2000, 2000], ['乙', 1000, -500]]);
    assert.deepEqual(model.totals.byCat, { apm: 50, 'indiv@0.32': 3000, 'indiv@0.3': 1500, team: 200 });
    assert.deepEqual(model.people.map(p => [p.name, p.hkRate, p.hk]), [['甲', '銷售個獎 5%', 300], ['乙', '銷售個獎 5%', 100]]);
    assert.equal(model.totals.hk, 400);

    const grid = buildPeriodResultGrid(model);
    const header = Array.from(grid.cells[1], c => c.v);
    assert.deepEqual(header.slice(0, 5), ['人員', '副專獎金\n0.05%', '銷售個獎\n0.32%', '銷售個獎\n0.3%', '銷售團獎\n0.08%']);
    assert.deepEqual(header.slice(-3), ['交屋保留款比例', '交屋保留款金額', '當期備註']);
    assert.deepEqual([grid.cells[2][13].v, grid.cells[2][14].v, grid.cells[2][14].s.bg], ['銷售個獎 5%', 300, '#fde2e2']);
    assert.equal(grid.cells[4][14].v, 400);

    const noHandover = buildPeriodResultModel({ period: 4, saved, categoryLabels: { indiv: '銷售個獎' } });
    assert.equal(noHandover.hasHandover, false);
    assert.ok(!Array.from(buildPeriodResultGrid(noHandover).cells[1], c => c.v).includes('交屋保留款比例'));
  });
  test('每人當期獎金結果：金額格附來源戶別（同戶跨方案合併、退佣另標），預覽 hover 用', () => {
    const b = (recId, unitId, personKey, amounts, type) => {
      const subtotal = Object.values(amounts).reduce((x, y) => x + y, 0);
      return { commissionRecordId: recId, unitId, type, period: 5, personKey, name: personKey, amounts, subtotal,
        keep: subtotal / 10, tax: 0, nhi: 0, net: subtotal * 0.9, keepPct: 10, taxPct: 0, nhiPct: 0 };
    };
    const records = [
      { id: 'g1', unitId: 'B2-3F', categories: { indiv: { ratePct: 0.3 } },
        handover: { byCat: { handover: { sourceCatKey: 'indiv', ratePct: 5, amount: 50 } } } },
      { id: 'p1', unitId: 'B2-3F', categories: { indiv: { ratePct: 0.3 } } },
      { id: 'g2', unitId: 'A1-10F', categories: { indiv: { ratePct: 0.3 } } },
      { id: 'rf', unitId: 'A1-2F', type: 'refund', categories: { indiv: { ratePct: 0.3 } } },
    ];
    const saved = [
      b('g1', 'B2-3F', '甲', { indiv: 1000 }),
      b('p1', 'B2-3F', '甲', { indiv: 200 }),
      b('g2', 'A1-10F', '甲', { indiv: 3000 }),
      b('g2', 'A1-10F', '乙', { indiv: 500 }),
      b('rf', 'A1-2F', '乙', { indiv: -400 }, 'refund'),
    ];
    const model = buildPeriodResultModel({
      period: 5, saved, records, categoryLabels: { indiv: '銷售個獎' }, indivKeys: ['indiv'],
      sorter: makePersonSorter([], ['甲', '乙']),
    });
    const [a, z] = model.people;
    assert.deepEqual(a.sources.indiv, [{ unit: 'A1-10F', amount: 3000 }, { unit: 'B2-3F', amount: 1200 }]);
    assert.deepEqual(a.sources.hk, [{ unit: 'B2-3F', amount: 50 }]);
    assert.deepEqual(z.sources.net, [{ unit: 'A1-2F(退佣)', amount: -360 }, { unit: 'A1-10F', amount: 450 }]);
    assert.deepEqual(model.totals.sources.indiv,
      [{ unit: 'A1-2F(退佣)', amount: -400 }, { unit: 'A1-10F', amount: 3500 }, { unit: 'B2-3F', amount: 1200 }]);

    const grid = buildPeriodResultGrid(model);
    const header = Array.from(grid.cells[1], c => c.v);
    const tipAt = (r, label) => grid.cellTips.find(t => t.r === r && t.c === header.indexOf(label));
    assert.equal(tipAt(2, '銷售個獎\n0.3%').title, '甲｜銷售個獎 0.3%');
    assert.deepEqual(tipAt(3, '實發').lines, z.sources.net);
    assert.equal(tipAt(4, '小計').title, '合計｜小計');
    assert.equal(tipAt(4, '交屋保留款金額').lines.length, 1);
    // 只有金額欄有來源；人員、比例、備註沒有
    assert.ok(grid.cellTips.every(t => !['人員', '保留款％', '交屋保留款比例', '當期備註'].includes(header[t.c])));
  });
  test('每戶當期獎金結果：每筆戶別紀錄一列（跨方案標方案、依方案與戶別順序、退佣紅字），類別格列金額與領取人員', async () => {
    const b = (recId, planId, personKey, amounts, extra = {}) => {
      const subtotal = Object.values(amounts).reduce((x, y) => x + y, 0);
      return { commissionRecordId: recId, planId, period: 9, personKey, name: personKey, amounts, subtotal,
        keep: subtotal / 10, tax: 0, nhi: 0, net: subtotal * 0.9, keepPct: 10, taxPct: 0, nhiPct: 0, requestDate: '2026-10-18', ...extra };
    };
    const snap = (buyerName, salesperson) => ({ buyerName, salesperson });
    const records = [
      { id: 'g-c16', planId: 'general', unitId: 'C-16', ratioPct: 100, calc: { dealAfter: 3680 }, snapshot: snap('林小姐', ['徐滋惠']),
        categories: { chairman: { ratePct: 0.1 }, indiv: { label: '銷售個獎', ratePct: 0.32 } },
        handover: { byCat: { handover: { sourceCatKey: 'indiv', ratePct: 5, amount: 589 } } } },
      { id: 'g-f18', planId: 'general', unitId: 'F-18', ratioPct: 50, calc: { dealAfter: 3459.5 }, snapshot: snap('陳先生', ['王智慧']),
        categories: { chairman: { ratePct: 0.1 } } },
      { id: 'p-c16', planId: 'package', unitId: 'C-16', ratioPct: 100, calc: { dealAfter: 250 }, snapshot: snap('林小姐', ['徐滋惠']),
        categories: { chairman: { ratePct: 0.05 } } },
      { id: 'g-a01', planId: 'general', unitId: 'A-01', type: 'refund', ratioPct: -100, calc: { dealAfter: 1000 }, snapshot: snap('張先生', []),
        categories: {}, sourceRecordIds: ['g-a01-old'] },
      { id: 'g-a01-old', planId: 'general', unitId: 'A-01', categories: { chairman: { ratePct: 0.1 } } },
    ];
    const saved = [
      b('g-c16', 'general', '主委 王志遠', { chairman: 36800 }),
      b('g-c16', 'general', '副主委 謝志誠', { chairman: 36800 }),
      b('g-c16', 'general', '徐滋惠', { indiv: 11776 }),
      b('g-f18', 'general', '主委 王志遠', { chairman: 17295 }),
      b('p-c16', 'package', '主委 王志遠', { chairman: 1250 }),
      b('g-a01', 'general', '主委 王志遠', { chairman: -10000 }),
    ];
    const model = buildPeriodUnitModel({
      period: 9, saved, records,
      categoryLabels: { chairman: '主委獎金', indiv: '銷售個獎' }, categoryOrder: ['chairman', 'indiv'], indivKeys: ['indiv'],
      sorter: makePersonSorter([], ['副主委 謝志誠', '主委 王志遠']),
      planOrder: ['general', 'package'], planNames: { general: '一般', package: '配套' },
      unitOrders: { general: ['F-18', 'C-16'] }, projectName: '測試建案',
    });
    assert.equal(model.title, '測試建案－每戶當期獎金結果　第 9 期（115 年 10 月）');
    assert.equal(model.multiPlan, true);
    assert.deepEqual(model.categories.map(c => [c.key, c.rateText]), [['chairman@0.1', '0.1%'], ['chairman@0.05', '0.05%'], ['indiv', '0.32%']]);
    assert.deepEqual(model.units.map(u => [u.unitId, u.planId, u.refund]),
      [['F-18', 'general', false], ['C-16', 'general', false], ['A-01', 'general', true], ['C-16', 'package', false]]);
    const c16 = model.units[1];
    assert.deepEqual(c16.byCat['chairman@0.1'], { amount: 73600, names: ['副主委 謝志誠', '主委 王志遠'] });
    assert.deepEqual([c16.subtotal, c16.keep, c16.net, c16.hkRate, c16.hk], [85376, 8537.6, 76838.4, '銷售個獎 5%', 589]);
    assert.equal(model.units[2].byCat['chairman@0.1'].amount, -10000);
    assert.deepEqual(model.totals.byCat, { 'chairman@0.1': 80895, 'chairman@0.05': 1250, indiv: 11776 });
    assert.equal(model.totals.after, 8389.5);

    const grid = buildPeriodUnitGrid(model);
    assert.equal(grid.name, '每戶當期獎金結果');
    assert.deepEqual(Array.from(grid.cells[1], c => c.v), ['戶別', '客戶姓名', '銷售人員', '折後總價(萬)', '獎金發放比例',
      '主委獎金\n0.1%', '主委獎金\n0.05%', '銷售個獎\n0.32%', '小計', '保留款', '稅金', '二代健保', '實發', '交屋保留款比例', '交屋保留款金額']);
    assert.deepEqual(Array.from(grid.cells[2], c => c.v).slice(0, 6), ['F-18（一般）', '陳先生', '王智慧', '3,459.5', '50%', '17,295\n主委 王志遠']);
    assert.equal(grid.cells[3][5].v, '73,600\n副主委 謝志誠\n主委 王志遠');
    assert.deepEqual([grid.cells[4][1].v, grid.cells[4][0].s.color, grid.cells[4][5].v], ['張先生(退佣)', '#C00000', '-10,000\n主委 王志遠']);
    assert.deepEqual(Array.from(grid.cells[6], c => c.v).slice(0, 9), ['合計', '', '', '8,389.5', '', 80895, 1250, 11776, 93921]);
    assert.equal(grid.cells[6][5].s.fmt, '#,##0');
    const workbook = XLSX.default.read(await (await gridsToExcelBlob([grid])).arrayBuffer(), { type: 'array' });
    assert.deepEqual(workbook.SheetNames, ['每戶當期獎金結果']);
    const pdf = await buildBonusPdf({ grids: [grid], paper: 'A3', orientation: 'landscape' });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');

    const single = buildPeriodUnitModel({ period: 9, saved: saved.filter(x => x.planId === 'general'), records, planNames: { general: '一般' } });
    assert.equal(buildPeriodUnitGrid(single).cells[2][0].v, 'A-01');
    assert.equal(buildPeriodUnitGrid(buildPeriodUnitModel({ period: 1, saved })).cells[2][0].v, '本期尚無獎金資料');
  });
  test('沒有可匯出資料時不建立空白合併工作表', () => {
    assert.equal(combineCommissionGrids([], '獎金'), null);
  });
} finally {
  await server.close();
}
