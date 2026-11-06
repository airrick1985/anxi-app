import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import {
  isPreferredPaymentOptionEnabled,
  isUnitPreferredPayment,
  preferredPaymentCategory,
  resolveSavedContractTemplateId,
  resolveUnitPreferredPayment,
  selectAutoPaymentTemplate,
} from '../../src/utils/paymentTemplateMatch.js';

// unitDocContext.js 用 @/ 路徑，這裡比照 vite 別名解析，才能測到真正的模組
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith('@/')) return nextResolve(specifier, context);
    return nextResolve(new URL(`../../src/${specifier.slice(2)}.js`, import.meta.url).href, context);
  },
});
const { buildUnitDocContext } = await import('../../src/utils/unitDocContext.js');

const cond = { propertyType: '住家', totalPrice: 2000, buyerType: '首購' };
const template = (id, paymentCategory, extra = {}) => ({
  id, paymentCategory, propertyType: '住家', buyerType: '首購', minPrice: 1000, maxPrice: 3000, ...extra,
});
const general = template('general', '一般期款');
const preferred = template('preferred', '優付期款');

test('優付開關有值時一律以開關為準', () => {
  assert.equal(isUnitPreferredPayment({ isPreferredPayment: true }), true);
  assert.equal(isUnitPreferredPayment({ isPreferredPayment: false }), false);
  // 開關是唯一能改的地方：usePreferredPayment 不可蓋過，否則關掉開關也改不回來
  assert.equal(isUnitPreferredPayment({ isPreferredPayment: false, usePreferredPayment: true }), false);
  assert.equal(isUnitPreferredPayment({ isPreferredPayment: true, usePreferredPayment: false }), true);
});

test('舊資料沒有開關值時才參考 usePreferredPayment', () => {
  assert.equal(isUnitPreferredPayment({ usePreferredPayment: true }), true);
  assert.equal(isUnitPreferredPayment({ usePreferredPayment: false }), false);
  assert.equal(isUnitPreferredPayment({ isPreferredPayment: null, usePreferredPayment: true }), true);
  assert.equal(isUnitPreferredPayment({}), false);
  assert.equal(isUnitPreferredPayment(null), false);
  assert.equal(isUnitPreferredPayment(undefined), false);
});

test('類別對應', () => {
  assert.equal(preferredPaymentCategory(true), '優付期款');
  assert.equal(preferredPaymentCategory(false), '一般期款');
  assert.equal(preferredPaymentCategory(undefined), '一般期款');
});

test('優付戶自動選優付期款範本，一般戶選一般期款範本', () => {
  const templates = [general, preferred];
  assert.equal(selectAutoPaymentTemplate(templates, true, cond), preferred);
  assert.equal(selectAutoPaymentTemplate(templates, false, cond), general);
});

test('優付戶沒有符合條件的優付範本：不預選，不退回一般期款', () => {
  assert.equal(selectAutoPaymentTemplate([general], true, cond), null);
  const outOfRange = template('out', '優付期款', { minPrice: 5000, maxPrice: 6000 });
  assert.equal(selectAutoPaymentTemplate([general, outOfRange], true, cond), null);
  const wrongBuyer = template('buyer', '優付期款', { buyerType: '非首購' });
  assert.equal(selectAutoPaymentTemplate([general, wrongBuyer], true, cond), null);
  const wrongType = template('type', '優付期款', { propertyType: '店面' });
  assert.equal(selectAutoPaymentTemplate([general, wrongType], true, cond), null);
});

test('一般戶沒有一般期款範本：不預選，不跨類別', () => {
  assert.equal(selectAutoPaymentTemplate([preferred], false, cond), null);
});

test('同類別多筆取第一個符合條件的範本，配套期款不參與', () => {
  const skipped = template('skipped', '一般期款', { minPrice: 5000, maxPrice: 6000 });
  const second = template('second', '一般期款');
  assert.equal(selectAutoPaymentTemplate([skipped, general, second], false, cond), general);
  assert.equal(selectAutoPaymentTemplate([template('pkg', '配套期款')], true, cond), null);
  assert.equal(selectAutoPaymentTemplate([template('pkg', '配套期款')], false, cond), null);
});

test('沒有範本時回傳 null', () => {
  assert.equal(selectAutoPaymentTemplate([], true, cond), null);
  assert.equal(selectAutoPaymentTemplate(undefined, false, cond), null);
});

const SHOWN = { quoteFieldDefaults: { preferredPayment: true } };
const HIDDEN = { quoteFieldDefaults: { preferredPayment: false } };

test('建案優付選項：沿用報價可見欄位的設定，舊欄位是後備，沒設定過預設隱藏', () => {
  assert.equal(isPreferredPaymentOptionEnabled(SHOWN), true);
  assert.equal(isPreferredPaymentOptionEnabled(HIDDEN), false);
  assert.equal(isPreferredPaymentOptionEnabled({ showPreferredPaymentInQuote: true }), true);
  assert.equal(isPreferredPaymentOptionEnabled({ showPreferredPaymentInQuote: false }), false);
  assert.equal(isPreferredPaymentOptionEnabled({ showPreferredPaymentInQuote: true, ...HIDDEN }), false);
  assert.equal(isPreferredPaymentOptionEnabled({}), false);
  assert.equal(isPreferredPaymentOptionEnabled(null), false);
  assert.equal(isPreferredPaymentOptionEnabled(undefined), false);
});

test('建案隱藏優付選項：一律視為非優付；開放時依戶別開關', () => {
  const prefUnit = { isPreferredPayment: true };
  const legacyUnit = { usePreferredPayment: true };
  assert.equal(resolveUnitPreferredPayment(prefUnit, SHOWN), true);
  assert.equal(resolveUnitPreferredPayment(legacyUnit, SHOWN), true);
  assert.equal(resolveUnitPreferredPayment({ isPreferredPayment: false, usePreferredPayment: true }, SHOWN), false);
  assert.equal(resolveUnitPreferredPayment({}, SHOWN), false);
  assert.equal(resolveUnitPreferredPayment(prefUnit, HIDDEN), false);
  assert.equal(resolveUnitPreferredPayment(legacyUnit, HIDDEN), false);
  // 拿不到建案設定：比照勾選框視為隱藏
  assert.equal(resolveUnitPreferredPayment(prefUnit, null), false);
  assert.equal(resolveUnitPreferredPayment(prefUnit, undefined), false);
  assert.equal(resolveUnitPreferredPayment(null, SHOWN), false);
});

test('建案隱藏優付選項：優付戶自動選到一般期款範本', () => {
  const templates = [general, preferred];
  const pick = project => selectAutoPaymentTemplate(templates, resolveUnitPreferredPayment({ isPreferredPayment: true }, project), cond);
  assert.equal(pick(SHOWN), preferred);
  assert.equal(pick(HIDDEN), general);
});

test('合約製作 context：優付判斷與付款表同規則，不再讀 usePreferredPayment 舊值', () => {
  const ctx = (unit, project) => buildUnitDocContext(unit, { project }).usePreferredPayment;
  assert.equal(ctx({ isPreferredPayment: true }, SHOWN), true);
  assert.equal(ctx({ isPreferredPayment: false, usePreferredPayment: true }, SHOWN), false);
  assert.equal(ctx({ usePreferredPayment: true }, SHOWN), true);
  assert.equal(ctx({ isPreferredPayment: true }, HIDDEN), false);
  assert.equal(ctx({ isPreferredPayment: true }, undefined), false);
  assert.equal(buildUnitDocContext(null, {}).usePreferredPayment, false);
});

test('已存合約：手動指定過的範本照舊還原，範本已刪除回到自動判斷', () => {
  const templates = [general, preferred];
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: 'preferred', manualRowsTemplateId: 'preferred' }, templates, false), 'preferred');
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: 'general', manualRowsTemplateId: 'general' }, templates, true), 'general');
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: 'gone', manualRowsTemplateId: 'gone' }, templates, true), null);
});

test('已存合約：當時自動判斷的範本，類別與現在不同時留在當時的範本，只有新製作才套新規則', () => {
  const templates = [general, preferred];
  // 舊版一律自動選到一般期款，優付戶改規則後不可悄悄換成優付期款
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: 'general' }, templates, true), 'general');
  // 反過來：存檔時是優付，現在建案隱藏優付選項
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: 'preferred' }, templates, false), 'preferred');
});

test('已存合約：類別沒變就照舊跟著自動判斷，總價變動仍可換同類別範本', () => {
  const higher = template('higher', '一般期款', { minPrice: 5000, maxPrice: 6000 });
  const templates = [general, higher, preferred];
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: 'general' }, templates, false), null);
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: 'preferred' }, templates, true), null);
});

test('已存合約：沒有存檔或當時沒有範本時走自動判斷，也就是新製作', () => {
  const templates = [general, preferred];
  assert.equal(resolveSavedContractTemplateId({}, templates, true), null);
  assert.equal(resolveSavedContractTemplateId(null, templates, true), null);
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: null }, templates, true), null);
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: 'gone' }, templates, true), null);
  assert.equal(resolveSavedContractTemplateId({ paymentTemplateId: null, manualRowsTemplateId: 'general' }, undefined, true), null);
});

test('付款表、合約製作都走共用規則，不各自判斷；帶入合約期款只讀合約資料', async () => {
  const read = file => readFile(new URL(`../../src/${file}`, import.meta.url), 'utf8');
  const [settings, schedule, importDialog, contractDialog] = await Promise.all([
    read('views/PaymentSettings.vue'),
    read('components/PaymentSchedulePreviewDialog.vue'),
    read('components/payment/PaymentContractImportDialog.vue'),
    read('components/contractDoc/ContractDocDialog.vue'),
  ]);
  assert.match(settings, /usePreferredPayment = resolveUnitPreferredPayment\(props\.unitData, paymentProject\.value\)/);
  assert.match(settings, /showPreferredPaymentOption = computed\(\(\) => isPreferredPaymentOptionEnabled\(paymentProject\.value\)\)/);
  assert.match(schedule, /selectAutoPaymentTemplate\(templates\.value, c\.usePreferredPayment,/);
  assert.match(importDialog, /fetchContractDocData\(householdDocId\.value\)/);
  assert.doesNotMatch(importDialog, /fetchPaymentTermTemplates|runNewCalculationEngine|selectAutoPaymentTemplate/);
  assert.match(contractDialog, /project: projectStore\.getProjectById\(props\.projectId\)/);
  assert.match(contractDialog, /selectAutoPaymentTemplate\(templates\.value, c\.usePreferredPayment, cond\)/);
  assert.doesNotMatch(contractDialog, /base <= t\.maxPrice/);
  assert.match(contractDialog, /manualTemplateId\.value = resolveSavedContractTemplateId\(saved, templates\.value, unitCtx\.value\.usePreferredPayment\)/);
  for (const source of [settings, schedule]) {
    assert.doesNotMatch(source, /isUnitPreferredPayment\(/);
    assert.doesNotMatch(source, /\?\s*'優付期款'\s*:\s*'一般期款'/);
  }
});
