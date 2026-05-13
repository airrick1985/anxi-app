// 驗屋授權書檔名顯示格式化
// 後端可能寫入兩種格式：
//   舊：「授權書-YYYY-MM-DD」
//   新：「{unitId}驗屋授權書-YYYY-MM-DD」
// 此工具統一輸出為「{unitId}驗屋授權書-YYYY-MM-DD」（顯示用，不改 DB 內容）

export function extractAuthLetterDate(name) {
  if (!name || typeof name !== 'string') return '';
  const m = name.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

export function formatAuthLetterName(file, unitId) {
  const rawName = (file && typeof file.name === 'string') ? file.name : '';
  const date = extractAuthLetterDate(rawName);
  const uid = unitId || '';

  // 若已是新格式且 unitId 一致，直接回傳原值
  if (uid && rawName.startsWith(`${uid}驗屋授權書`)) return rawName;

  if (date && uid) return `${uid}驗屋授權書-${date}`;
  if (date) return `驗屋授權書-${date}`;
  return rawName || '驗屋授權書';
}
