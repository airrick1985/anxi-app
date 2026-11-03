/**
 * 銷控資料透視「方案」（建案層級共用，非個人）
 *
 * 集合：salesPivotPresets（存取邏輯見 pivotPresetService.js）
 * settings: {
 *   v, rowDims, colDims, values, filters, sort, colKeyOrder,
 *   statuses, propertyTypes,            // 資料範圍
 *   showBoth, cellPct, showChart, numericBinning, // 顯示選項
 * }
 */
import { createPivotPresetService } from './pivotPresetService';

export { PIVOT_PRESET_NAME_MAX, normalizePresetName, sortPresets } from './pivotPresetService';

export const PIVOT_PRESET_COLLECTION = 'salesPivotPresets';

export const {
  listenToProjectPivotPresets,
  createPivotPreset,
  updatePivotPreset,
  deletePivotPreset,
} = createPivotPresetService(PIVOT_PRESET_COLLECTION);
