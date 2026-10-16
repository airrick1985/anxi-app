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
  const { draftClaimRecord } = await server.ssrLoadModule('/src/utils/commissionDraftRecords.js');
  const service = fs.readFileSync(new URL('../../src/services/commissionExcelService.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export (async )?function/g, '$1function');
  const { buildBonusGrids, buildPersonGrid, buildPersonExcelGrids, gridsToExcelBlob } = vm.runInNewContext(`${service}\n({ buildBonusGrids, buildPersonGrid, buildPersonExcelGrids, gridsToExcelBlob })`,
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
    assert.deepEqual([grid.cells[1][14].v, grid.cells[1][15].v], ['個獎費率', '團獎費率']);
    assert.deepEqual(Array.from(grid.cells.slice(3, 5), r => `${r[14].v}/${r[15].v}`), ['0.3%/0.1%', '0.32%/0.08%']);
    assert.equal(grid.cells[1][16].v, '甲');
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
    assert.deepEqual([grid.cells[1][16].v, grid.cells[1][17].v], ['交屋保留款費率', '交屋保留款金額']);
    assert.deepEqual([grid.cells[3][16].v, grid.cells[3][17].v], ['銷售個獎 5%', 5000]);
    assert.equal(grid.cells[5][17].v, 5000);
    assert.equal(grid.cells[1][18].v, '甲');
    const plain = buildBonusModel({ records: [recs[1]], bonusRecords: [br[1]], settings: rs, period: 1 }).groups[0];
    assert.equal(buildBonusGrids({ groups: [plain], style: {} })[0].cells[1][16].v, '甲');
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
    ['交屋保留款費率', '交屋保留款金額', '交屋保留款', '其中交屋保留款'].forEach(t => assert.ok(cells.some(c => c.v === t), t));
    const rowOf = v => grid.cells.findIndex(row => row?.some(c => c?.v === v));
    assert.ok(grid.cells[rowOf('其中交屋保留款')].some(c => c?.v === 80 && c?.s?.bg === '#fde2e2'));
    const totals = grid.cells.filter(row => row?.[0]?.v === '合計');
    assert.ok(totals.every(row => row.some(c => c?.v === 80)), '每戶明細與期別彙總合計含交屋保留款');

    // 非本戶銷售人員（只領專案獎金）：欄位仍顯示，金額 0、費率空白
    const pm = buildPersonModel({ ...opts, periods: [1], personKey: '丙' });
    assert.deepEqual(pm.rows.map(r => [r.hkRate, r.hk]), [['', 0]]);
    assert.equal(pm.retention.hkTotal, 0);
    const pmGrid = buildPersonGrid(pm);
    assert.ok(pmGrid.cells.flat().some(c => c?.v === '其中交屋保留款'));
    assert.ok(buildPersonExcelGrids(pm)[0].cells.flat().some(c => c?.v === '交屋保留款'));
  });
  test('沒有可匯出資料時不建立空白合併工作表', () => {
    assert.equal(combineCommissionGrids([], '獎金'), null);
  });
} finally {
  await server.close();
}
