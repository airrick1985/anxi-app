/**
 * 資料透視「方案」共用服務（建案層級共用，非個人）
 *
 * 每個系統一個頂層集合，依 projectId 篩選（與 announcements 相同模式）：
 *   - salesPivotPresets：銷控資料透視
 *   - inspectionPivotPresets：驗屋預約資料透視
 * 文件欄位：
 *   projectId, name, settings（各系統自行定義的透視設定快照）,
 *   createdAt, updatedAt, createdByName, createdByKey, updatedByName, updatedByKey
 *
 * 只用單一 where（projectId），排序在前端做，避免額外的複合索引。
 */
import { db } from '@/firebase';
import {
  collection, doc, onSnapshot, query, where,
  setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

export const PIVOT_PRESET_NAME_MAX = 30;

export function normalizePresetName(name) {
  return String(name || '').trim().slice(0, PIVOT_PRESET_NAME_MAX);
}

/** 顯示排序：依名稱（中文自然排序） */
export function sortPresets(list) {
  return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant', { numeric: true }));
}

/** 建立指定集合的方案存取函式 */
export function createPivotPresetService(collectionName) {
  function listenToProjectPivotPresets(projectId, onData, onError) {
    const q = query(collection(db, collectionName), where('projectId', '==', projectId));
    return onSnapshot(q, (snap) => {
      onData(sortPresets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, (err) => {
      console.error(`監聽透視方案失敗 (${collectionName}, Project: ${projectId}):`, err);
      if (onError) onError(err);
    });
  }

  async function createPivotPreset(projectId, name, settings, author) {
    const ref = doc(collection(db, collectionName));
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
  async function updatePivotPreset(id, patch, author) {
    const data = { updatedAt: serverTimestamp(), updatedByName: author?.name || '', updatedByKey: author?.key || '' };
    if (patch.name !== undefined) data.name = normalizePresetName(patch.name);
    if (patch.settings !== undefined) data.settings = patch.settings;
    await updateDoc(doc(db, collectionName, id), data);
  }

  async function deletePivotPreset(id) {
    await deleteDoc(doc(db, collectionName, id));
  }

  return { listenToProjectPivotPresets, createPivotPreset, updatePivotPreset, deletePivotPreset };
}
