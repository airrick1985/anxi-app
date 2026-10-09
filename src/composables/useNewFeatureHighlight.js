import { ref } from 'vue';
import { useUserStore } from '@/store/user';

// 新功能高亮：功能設定 newForDays，每位使用者在此瀏覽器首次看到起算 N 天，點過即取消
const DAY_MS = 24 * 60 * 60 * 1000;
const memory = new Map(); // localStorage 不可用時仍維持本次開啟期間的狀態
const version = ref(0);   // 點過後通知各使用處重新計算

const storageKey = (id, userKey) => `anxi-new-feature:${id}:${userKey || 'anon'}`;

function load(key) {
  if (!memory.has(key)) {
    let record = null;
    try { record = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* ignore */ }
    memory.set(key, record);
  }
  return memory.get(key);
}

function save(key, record) {
  memory.set(key, record);
  try { localStorage.setItem(key, JSON.stringify(record)); } catch { /* ignore */ }
}

export function useNewFeatureHighlight() {
  const userStore = useUserStore();

  function isHighlighted(feature) {
    void version.value;
    if (!feature?.newForDays) return false;
    const key = storageKey(feature.id, userStore.user?.key);
    let record = load(key);
    if (!record) {
      record = { firstSeenAt: Date.now() };
      save(key, record);
    }
    if (record.dismissed) return false;
    return Date.now() - record.firstSeenAt < feature.newForDays * DAY_MS;
  }

  function dismiss(feature) {
    if (!feature?.newForDays) return;
    const key = storageKey(feature.id, userStore.user?.key);
    const record = load(key);
    if (record?.dismissed) return;
    save(key, { firstSeenAt: Date.now(), ...record, dismissed: true });
    version.value++;
  }

  return { isHighlighted, dismiss };
}
