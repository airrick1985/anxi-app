import { computed, ref } from 'vue';
import { useUserStore } from '@/store/user';
import { getAvailableHomeFeatures } from '@/config/homeFeatures';

const ORDER_KEY = 'homeButtonOrder';

function readButtonOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(id => typeof id === 'string'))] : [];
  } catch {
    return [];
  }
}

// Shared within the app so dragging on Home also updates the open drawer.
const buttonOrder = ref(readButtonOrder());

export function useHomeFeatures() {
  const userStore = useUserStore();
  const visibleButtons = computed({
    get() {
      const available = getAvailableHomeFeatures(userStore);
      const byId = new Map(available.map(button => [button.id, button]));
      const sorted = buttonOrder.value.map(id => byId.get(id)).filter(Boolean);
      const orderedIds = new Set(buttonOrder.value);
      return [...sorted, ...available.filter(button => !orderedIds.has(button.id))];
    },
    set(buttons) {
      buttonOrder.value = [...new Set(buttons.map(button => button.id))];
    },
  });

  function saveButtonOrder() {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(buttonOrder.value));
    } catch {
      // Navigation and in-session ordering still work if storage is unavailable.
    }
  }

  const navigationEntries = computed(() => visibleButtons.value.filter(button => button.nav));
  return { visibleButtons, navigationEntries, saveButtonOrder };
}
