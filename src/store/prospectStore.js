// src/store/prospectStore.js
// 客戶開發：快取全部 prospects 與「今日待追蹤」數（docs/SPEC_CustomerProspecting.md §3.1 / §4.1）
import { defineStore } from 'pinia';
import { fetchProspects, isDueForFollowUp } from '@/services/prospectService';

export const useProspectStore = defineStore('prospect', {
  state: () => ({
    prospects: [],
    loaded: false,
    loading: false,
    lastLoadedAt: 0,
  }),
  getters: {
    byId: (state) => Object.fromEntries(state.prospects.map((p) => [p.id, p])),
    dueToday: (state) => state.prospects.filter((p) => isDueForFollowUp(p)),
    dueTodayCount() {
      return this.dueToday.length;
    },
  },
  actions: {
    async load(force = false) {
      if (this.loading) return;
      if (this.loaded && !force && Date.now() - this.lastLoadedAt < 60 * 1000) return;
      this.loading = true;
      try {
        this.prospects = await fetchProspects();
        this.loaded = true;
        this.lastLoadedAt = Date.now();
      } finally {
        this.loading = false;
      }
    },
    /** 局部更新（詳情面板回傳） */
    patch(id, patch) {
      const target = this.prospects.find((p) => p.id === id);
      if (target) Object.assign(target, patch);
    },
    upsert(p) {
      const idx = this.prospects.findIndex((x) => x.id === p.id);
      if (idx >= 0) this.prospects.splice(idx, 1, { ...this.prospects[idx], ...p });
      else this.prospects.push(p);
    },
    remove(ids) {
      const set = new Set(Array.isArray(ids) ? ids : [ids]);
      this.prospects = this.prospects.filter((p) => !set.has(p.id));
    },
    reset() {
      this.prospects = [];
      this.loaded = false;
      this.lastLoadedAt = 0;
    },
  },
});
