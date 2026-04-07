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
    salesList: [], 
    hiddenSalesIds: [],
    // ✅ [新增] 用來記錄目前 salesList 是屬於哪個建案的
    currentSalesListProjectId: null, 
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
     * ✅ [修改] 取得該建案符合權限的銷售人員
     * 加入 currentSalesListProjectId 檢查，避免跨建案資料殘留
     */
    async fetchProjectSales(projectId) {
        if (!projectId) return;
        
        try {
            // 1. 讀取隱藏設定 (這部分每次都讀取，確保設定最新)
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
                const data = projectSnap.data();
                this.hiddenSalesIds = data.viewingSettings?.hiddenSalesIds || [];
            } else {
                this.hiddenSalesIds = [];
            }

            // ✅ [關鍵修改] 檢查快取：
            // 只有當「列表有資料」且「目前快取的建案 ID == 請求的建案 ID」時，才直接返回
            if (this.salesList.length > 0 && this.currentSalesListProjectId === projectId) {
                // console.log('使用快取銷售名單');
                return;
            }

            // console.log('重新撈取銷售名單...');
            
            // 2. 清空舊資料並更新 ID 標記
            this.salesList = [];
            this.currentSalesListProjectId = projectId;

            // 3. 撈取所有使用者
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            
            const qualifiedSales = [];

            for (const userDoc of snapshot.docs) {
                const userData = userDoc.data();
                const userKey = userDoc.id;

                if (!userData.name) continue;

                // 檢查黑名單
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
                      // ✅ 優化：支持新的權限命名規則（客資系統-銷售 或 客資系統-櫃台）
                      const hasAuth = projectPerms.systems.some(sys =>
                          sys === '報價系統' ||
                          sys === '銷控系統' ||
                          sys === '客資系統-銷售' ||
                          sys === '客資系統-櫃台' ||
                          sys.includes('客資系統') // 向後相容
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
     * ✅ [修改] 移除時間檢查，只要是 status === 'active' 都視為衝突
     * 這樣可以捕捉到「剛過時間但尚未結案」或「所有有效」的預約
     */
    async checkPhoneConflict(projectId, phone) {
      if (!phone || !projectId) return null;
      
      try {
        // const now = Timestamp.now(); // ❌ 移除這行
        const q = query(
            collection(db, "viewing_reservations"),
            where("projectId", "==", projectId),
            where("customerPhone", "==", phone),
            where("status", "==", "active") // ✅ 只檢查狀態是否為 active
            // where("reservationTime", ">", now) // ❌ 移除此行
        );

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // 回傳第一筆衝突的資料
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;

      } catch (err) {
        console.error("checkPhoneConflict Error:", err);
        return null; 
      }
    },

    /**
 * 檢查客資資料庫 (vipGuests) 是否已存在此電話
 */
async checkVipGuestPhone(projectId, phone) {
  if (!phone || !projectId) return null;
  
  try {
    const q = query(
      collection(db, "vipGuests"),
      where("projectId", "==", projectId),
      where("searchablePhones", "array-contains", phone)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // 取得第一筆匹配的客資資料
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        latestSalesName: data.latestSalesName || '未知銷售',
        latestSalesPhone: data.latestSalesPhone || '' 
      };
    }
    return null;
  } catch (err) {
    console.error("checkVipGuestPhone Error:", err);
    return null;
  }
},


  }
});

