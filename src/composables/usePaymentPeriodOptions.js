// 讀取期別下拉選單的選項，規則見 utils/contractPaymentPlan.js 的 resolvePeriodOptions
import { ref } from 'vue';
import { fetchContractDocData, fetchPaymentTermTemplates } from '@/api';
import { isSpecialContractType } from '@/composables/usePriceFormula';
import { resolvePeriodOptions } from '@/utils/contractPaymentPlan';
import { useProjectStore } from '@/store/projectStore';

/**
 * @param {() => { projectId?: string, unitId?: string, unitData?: object|null }} source
 *   沒有 unitId 時（批次新增）只看建案範本；讀取失敗時只剩「未指定」與「其他」，不擋操作
 */
export function usePaymentPeriodOptions(source) {
  const projectStore = useProjectStore();
  const options = ref([]);
  let pending = null;

  async function fetchOptions() {
    const { projectId, unitId, unitData } = source();
    if (!projectId) return [];
    const [templateResult, contractDocData] = await Promise.all([
      fetchPaymentTermTemplates(projectId).catch(() => null),
      unitId ? fetchContractDocData(unitData?.id || `${projectId}_${unitId}`).catch(() => null) : null,
    ]);
    return resolvePeriodOptions({
      contractDocData,
      templates: templateResult?.status === 'success' ? templateResult.data : [],
      isPackageContract: unitData
        ? isSpecialContractType(unitData.contractType, projectStore.getProjectById(projectId)?.packageContractTypes)
        : undefined,
    });
  }

  function load() {
    pending = fetchOptions().then((names) => {
      options.value = names;
      return names;
    });
    return pending;
  }

  return { options, load, ready: () => pending || load() };
}
