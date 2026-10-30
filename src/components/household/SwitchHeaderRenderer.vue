<template>
  <div class="d-flex flex-column align-center justify-center w-100 h-100">
    <span>{{ params.displayName }}</span>
    <!-- AG Grid 表頭的欄位拖曳會對 touchstart 呼叫 preventDefault（連表頭內的 input 也會），
         觸控裝置因此收不到 click、開關點了沒反應；在這裡攔下事件，不讓它傳到表頭 -->
    <div
      class="d-flex align-center mt-n2"
      @pointerdown.stop
      @mousedown.stop
      @touchstart.stop
      @touchend.stop
    >
      <span class="mr-1 text-caption">全選</span>
      <v-switch
        v-model="checked"
        :indeterminate="indeterminate"
        @update:modelValue="onToggle"
        color="success"
        hide-details
        density="compact"
      ></v-switch>
    </div>
  </div>
</template>

<script>
import { batchUpdateHouseholds } from '@/api';

export default {
  props: { params: { type: Object, required: true } },
  data() {
    return {
      checked: false,
      indeterminate: false,
    };
  },
  methods: {
    async onToggle(newValue) {
      const field = this.params.column.getColDef().field;
      const notify = this.params.context?.notify;
      const updates = [];

      this.params.api.forEachNode(node => {
        if (node.data) {
          updates.push({
            docId: node.data._docId,
            data: { [field]: newValue }
          });
        }
      });

      if (updates.length > 0) {
        try {
          // batchUpdateHouseholds 失敗時不會 throw，而是回傳 { status: 'error' }
          const result = await batchUpdateHouseholds(updates);
          if (result?.status !== 'success') throw new Error(result?.message || '未知錯誤');
          this.params.api.forEachNode(node => {
            node.setDataValue(field, newValue);
          });
          notify?.(`已將 ${updates.length} 戶的「${this.params.displayName}」全部${newValue ? '開啟' : '關閉'}`, 'success');
        } catch (e) {
          console.error('批次更新失敗', e);
          notify?.(`「${this.params.displayName}」全選更新失敗：${e.message}`, 'error');
        }
        this.updateHeaderState();
      }
    },
    updateHeaderState() {
      const field = this.params.column.getColDef().field;
      let trueCount = 0;
      let totalCount = 0;
      this.params.api.forEachNode(node => {
        if (node.data) {
          if (node.data[field] === true) {
            trueCount++;
          }
          totalCount++;
        }
      });

      if (totalCount === 0) {
        this.checked = false;
        this.indeterminate = false;
      } else if (trueCount === totalCount) {
        this.checked = true;
        this.indeterminate = false;
      } else if (trueCount === 0) {
        this.checked = false;
        this.indeterminate = false;
      } else {
        this.checked = false;
        this.indeterminate = true;
      }
    },
  },
  mounted() {
    this.params.api.addEventListener('modelUpdated', this.updateHeaderState);
    this.updateHeaderState();
  },
  beforeUnmount() {
    this.params.api.removeEventListener('modelUpdated', this.updateHeaderState);
  }
};
</script>
