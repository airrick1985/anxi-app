import { inject, computed } from 'vue';
import { DEFAULT_PLANS, planIdOf } from '@/utils/commissionPlans';

export function useCommissionPlan() {
  const plan = inject('commissionPlan', computed(() => DEFAULT_PLANS[0]));
  const planId = computed(() => plan.value.id);
  const belongsToPlan = row => planIdOf(row) === planId.value;
  return { plan, planId, belongsToPlan };
}
