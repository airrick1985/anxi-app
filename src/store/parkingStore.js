import { defineStore } from 'pinia';
import { listenToParkingLots } from '@/api';

export const useParkingStore = defineStore('parking', {
    state: () => ({
        parkingData: [],
        isLoading: false,
        unsubscribe: null
    }),
    actions: {
        initializeParkingData(projectId) {
            if (this.unsubscribe) {
                this.unsubscribe();
            }
            
            this.isLoading = true;
            this.unsubscribe = listenToParkingLots(projectId, 
                (data) => {
                    this.parkingData = data;
                    this.isLoading = false;
                },
                (error) => {
                    console.error('監聽車位資料時發生錯誤:', error);
                    this.isLoading = false;
                }
            );
        },
        cleanup() {
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
        }
    }
});