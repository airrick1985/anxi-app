import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  setDoc, // ✅ 用於儲存設定
  Timestamp, 
  serverTimestamp, 
  orderBy 
} from "firebase/firestore";

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    reservations: [], 
    salesList: [], // 存放所有符合資格的銷售人員 (包含被設定隱藏的)
    hiddenSalesIds: [], // ✅ 新增：被設定為隱藏的銷售 ID 列表
    loading: false,
    error: null,
  }),

  getters: {
    // 取得所有有效的預約
    activeReservations: (state) => {
      return state.reservations.filter(r => r.status === 'active');
    },
    // 根據日期排序
    sortedReservations: (state) => {
      return [...state.reservations].sort((a, b) => {
        return a.reservationTime.seconds - b.reservationTime.seconds;
      });
    },
    // ✅ 新增：取得「未被隱藏」的銷售人員 (供預約 Dialog 下拉選單使用)
    visibleSalesList: (state) => {
      // 過濾掉在 hiddenSalesIds 中的人員
      return state.salesList.filter(s => !state.hiddenSalesIds.includes(s.id));
    }
  },

  actions: {
    /**
     * 讀取指定建案的預約資料
     */
    async fetchReservations(projectId, startDate = null, endDate = null) {
      if (!projectId) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const collectionRef = collection(db, "viewing_reservations");
        
        let conditions = [
          where("projectId", "==", projectId),
          where("status", "==", "active") 
        ];

        // 如果有指定日期範圍
        if (startDate && endDate) {
          conditions.push(where("reservationTime", ">=", Timestamp.fromDate(startDate)));
          conditions.push(where("reservationTime", "<=", Timestamp.fromDate(endDate)));
        }

        const q = query(collectionRef, ...conditions, orderBy("reservationTime", "asc"));
        
        const querySnapshot = await getDocs(q);
        
        this.reservations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      } catch (err) {
        console.error("fetchReservations Error:", err);
        if (err.message.includes('index')) {
            this.error = "系統需要建立索引才能查詢，請通知管理員查看 Console。";
        } else {
            this.error = "載入預約資料失敗";
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * ✅ 取得該建案符合權限的銷售人員
     * 修改包含：
     * 1. 同步讀取顯示/隱藏設定
     * 2. 排除「系統管理員」角色 (黑名單)
     */
    async fetchProjectSales(projectId) {
        if (!projectId) return;
        
        try {
            // 1. 同步讀取專案設定 (取得隱藏名單)
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
                const data = projectSnap.data();
                // 讀取 viewingSettings.hiddenSalesIds
                this.hiddenSalesIds = data.viewingSettings?.hiddenSalesIds || [];
            }

            // 如果名單已存在，就不重複撈取 Users (節省流量)
            if (this.salesList.length > 0) return;

            // 2. 撈取所有使用者
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            
            const qualifiedSales = [];

            for (const userDoc of snapshot.docs) {
                const userData = userDoc.data();
                const userKey = userDoc.id;

                if (!userData.name) continue;

                // ✅ 檢查黑名單：若包含「系統管理員」，直接跳過
                const roles = userData.roles || [];
                if (roles.includes('超級管理員')) {
                    continue; 
                }

                // 檢查權限
                const permRef = doc(db, "userPermissions", userKey);
                const permSnap = await getDoc(permRef);
                
                if (permSnap.exists()) {
                    const perms = permSnap.data().permissions || {};
                    const projectPerms = perms[projectId];

                    if (projectPerms && projectPerms.systems) {
                         const hasAuth = projectPerms.systems.some(sys => 
                            sys === '報價系統' || sys === '銷控系統'
                         );
                         
                         if (hasAuth) {
                             qualifiedSales.push({
                                 id: userKey,
                                 name: userData.name,
                                 phone: userData.phone || ''
                             });
                         }
                    }
                }
            }
            
            this.salesList = qualifiedSales;
            
        } catch (err) {
            console.error("fetchProjectSales Error:", err);
        }
    },

    /**
     * ✅ 新增：更新銷售人員顯示/隱藏設定
     * 將設定儲存至 projects/{projectId} 文件中
     */
    async updateSalesVisibility(projectId, newHiddenIds) {
        try {
            const projectRef = doc(db, "projects", projectId);
            
            // 更新本地 State
            this.hiddenSalesIds = newHiddenIds;

            // 寫入 Firestore (使用 merge 避免覆蓋其他設定)
            await setDoc(projectRef, {
                viewingSettings: {
                    hiddenSalesIds: newHiddenIds
                }
            }, { merge: true });

            return { success: true };
        } catch (err) {
            console.error("updateSalesVisibility Error:", err);
            return { success: false, error: err.message };
        }
    },

    /**
     * 新增預約
     */
    async addReservation(payload) {
      this.loading = true;
      try {
        const docData = {
          projectId: payload.projectId,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          reservationTime: Timestamp.fromDate(payload.reservationTime),
          type: payload.type,
          
          salesId: payload.salesId || null,
          salesName: payload.salesName || '',
          salesPhone: payload.salesPhone || '',
          
          note: payload.note || '',
          
          operatorId: payload.operatorId,
          operatorName: payload.operatorName,
          
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "viewing_reservations"), docData);
        
        // 更新本地 State
        this.reservations.push({
          id: docRef.id,
          ...docData,
          reservationTime: docData.reservationTime
        });
        
        return { success: true, id: docRef.id };
        
      } catch (err) {
        console.error("addReservation Error:", err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新預約
     */
    async updateReservation(id, updateData) {
      this.loading = true;
      try {
        const docRef = doc(db, "viewing_reservations", id);
        
        if (updateData.reservationTime instanceof Date) {
            updateData.reservationTime = Timestamp.fromDate(updateData.reservationTime);
        }

        const finalUpdateData = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, finalUpdateData);

        const index = this.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reservations[index] = { ...this.reservations[index], ...finalUpdateData };
        }

        return { success: true };
      } catch (err) {
        console.error("updateReservation Error:", err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 取消預約 (冷刪除)
     */
    async cancelReservation(id, cancelReason = '') {
      this.loading = true;
      try {
        const docRef = doc(db, "viewing_reservations", id);
        
        await updateDoc(docRef, {
            status: 'deleted',
            cancelReason: cancelReason,
            updatedAt: serverTimestamp()
        });

        const index = this.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reservations[index].status = 'deleted';
        }

        return { success: true };
      } catch (err) {
        console.error("cancelReservation Error:", err);
        return { success: false, error: err.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 檢查電話衝突
     */
    async checkPhoneConflict(projectId, phone) {
      if (!phone || !projectId) return null;
      
      try {
        const now = Timestamp.now();
        const q = query(
            collection(db, "viewing_reservations"),
            where("projectId", "==", projectId),
            where("customerPhone", "==", phone),
            where("status", "==", "active"),
            where("reservationTime", ">", now)
        );

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;

      } catch (err) {
        console.error("checkPhoneConflict Error:", err);
        return null; 
      }
    }
  }
});