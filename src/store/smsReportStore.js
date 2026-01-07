import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export const useSmsReportStore = defineStore('smsReports', {
  state: () => ({
    reports: [],
    loading: false
  }),
  actions: {
    fetchReports() {
      this.loading = true;
      const q = query(collection(db, "sms_reports"), orderBy("receivedAt", "desc"), limit(500));
      
      return onSnapshot(q, (snapshot) => {
        this.reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.loading = false;
      });
    }
  }
});