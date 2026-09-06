// 超級管理員 AI 管理後台共用：呼叫 salesAiAdmin（自動附加身份）＋ 設定快取
import { ref } from 'vue';
import { salesAiAdminApi } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast } from 'vue-toastification';

const settings = ref(null);
const loading = ref(false);

export function useAiAdmin() {
  const userStore = useUserStore();
  const toast = useToast();

  async function call(action, payload = {}) {
    return salesAiAdminApi({ action, userKey: userStore.user?.key, sessionId: userStore.sessionId, ...payload });
  }

  async function refresh() {
    loading.value = true;
    try { settings.value = await call('getSettings'); }
    catch (e) { toast.error(`讀取 AI 設定失敗：${e.message}`); }
    finally { loading.value = false; }
    return settings.value;
  }

  async function run(action, payload, { success = null, silent = false } = {}) {
    try {
      const r = await call(action, payload);
      if (success) toast.success(success);
      return r;
    } catch (e) {
      if (!silent) toast.error(e.message.replace(/^FirebaseError:\s*/, ''));
      throw e;
    }
  }

  return { settings, loading, call, run, refresh };
}
