<template>
  <div class="d-flex flex-column align-center justify-center w-100 h-100">
    <span>{{ params.displayName }}</span>
    <div class="d-flex align-center mt-n2">
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
          await batchUpdateHouseholds(updates);
          this.params.api.forEachNode(node => {
            node.setDataValue(field, newValue);
          });
          this.updateHeaderState();
        } catch (e) {
          console.error('批次更新失敗', e);
        }
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
