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

// 由 authorizationLetterUrl 陣列依日期取最新一筆
export function getLatestAuthLetter(arr) {
  if (!Array.isArray(arr)) return null;
  const list = arr.filter(f => f && typeof f === 'object');
  if (list.length === 0) return null;
  return list.slice().sort((a, b) => {
    const da = (a.signedAt || extractAuthLetterDate(a.name) || '');
    const db = (b.signedAt || extractAuthLetterDate(b.name) || '');
    return db.localeCompare(da);
  })[0];
}

// 由 authorizationLetterUrl 陣列彙總「最新的」受託人資訊
// 舊資料若無 agentName 等欄位則回傳空字串（不會顯示為 undefined）
export function getLatestAgentInfo(arr) {
  const latest = getLatestAuthLetter(arr);
  return {
    agentName: latest?.agentName || '',
    agentPhone: latest?.agentPhone || '',
    agentRelationship: latest?.agentRelationship || '',
    principalName: latest?.principalName || '',
    principalPhone: latest?.principalPhone || '',
    signedAt: latest?.signedAt || extractAuthLetterDate(latest?.name) || ''
  };
}
