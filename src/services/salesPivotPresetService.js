/**
 * 銷控資料透視「方案」（建案層級共用，非個人）
 *
 * 集合：salesPivotPresets（頂層，依 projectId 篩選，與 announcements 相同模式）
 * 文件欄位：
 *   projectId, name,
 *   settings: {
 *     v, rowDims, colDims, values, filters, sort, colKeyOrder,
 *     statuses, propertyTypes,            // 資料範圍
 *     showBoth, cellPct, showChart, numericBinning, // 顯示選項
 *   },
 *   createdAt, updatedAt, createdByName, createdByKey, updatedByName, updatedByKey
 *
 * 只用單一 where（projectId），排序在前端做，避免額外的複合索引。
 */
import { db } from '@/firebase';
import {
  collection, doc, onSnapshot, query, where,
  setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

export const PIVOT_PRESET_COLLECTION = 'salesPivotPresets';
export const PIVOT_PRESET_NAME_MAX = 30;

export function normalizePresetName(name) {
  return String(name || '').trim().slice(0, PIVOT_PRESET_NAME_MAX);
}

/** 顯示排序：依名稱（中文自然排序） */
export function sortPresets(list) {
  return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant', { numeric: true }));
}

export function listenToProjectPivotPresets(projectId, onData, onError) {
  const q = query(collection(db, PIVOT_PRESET_COLLECTION), where('projectId', '==', projectId));
  return onSnapshot(q, (snap) => {
    onData(sortPresets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, (err) => {
    console.error(`監聽透視方案失敗 (Project: ${projectId}):`, err);
    if (onError) onError(err);
  });
}

export async function createPivotPreset(projectId, name, settings, author) {
  const ref = doc(collection(db, PIVOT_PRESET_COLLECTION));
  await setDoc(ref, {
    projectId,
    name: normalizePresetName(name),
    settings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdByName: author?.name || '',
    createdByKey: author?.key || '',
    updatedByName: author?.name || '',
    updatedByKey: author?.key || '',
  });
  return ref.id;
}

/** 覆寫方案內容（可同時改名） */
export async function updatePivotPreset(id, patch, author) {
  const data = { updatedAt: serverTimestamp(), updatedByName: author?.name || '', updatedByKey: author?.key || '' };
  if (patch.name !== undefined) data.name = normalizePresetName(patch.name);
  if (patch.settings !== undefined) data.settings = patch.settings;
  await updateDoc(doc(db, PIVOT_PRESET_COLLECTION, id), data);
}

export async function deletePivotPreset(id) {
  await deleteDoc(doc(db, PIVOT_PRESET_COLLECTION, id));
}
