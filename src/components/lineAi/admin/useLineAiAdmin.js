// LINE AI 助理後台共用：設定快取、呼叫 lineAiAdmin、使用者清單
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { lineAiAdminCall, errorText } from '../useLineAi';

const settings = ref(null);
const loading = ref(false);
const users = ref([]);
let usersPromise = null;

export function useLineAiAdmin() {
  const toast = useToast();

  async function refresh() {
    loading.value = true;
    try { settings.value = await lineAiAdminCall('getSettings'); }
    catch (e) { toast.error(`讀取設定失敗：${errorText(e)}`); }
    finally { loading.value = false; }
    return settings.value;
  }

  async function run(action, payload, { success = null, silent = false } = {}) {
    try {
      const r = await lineAiAdminCall(action, payload);
      if (success) toast.success(success);
      return r;
    } catch (e) {
      if (!silent) toast.error(errorText(e));
      throw e;
    }
  }

  function loadUsers() {
    if (!usersPromise) {
      usersPromise = lineAiAdminCall('listUsers')
        .then(r => { users.value = r.users || []; return users.value; })
        .catch(e => { usersPromise = null; toast.error(errorText(e)); return []; });
    }
    return usersPromise;
  }

  return { settings, loading, users, refresh, run, loadUsers };
}

export const SEND_MODE_LABEL = { manual: '使用者自己送', bot: '官方帳號代發', both: '兩者皆可' };
