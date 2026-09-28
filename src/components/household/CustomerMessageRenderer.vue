<template>
  <div class="d-flex justify-center align-center h-100">
     <v-btn v-if="messageCount > 0"
        color="info" size="small" variant="tonal"
        @click.stop="onClick"
        class="px-2"
        style="min-width: 60px;"
     >
        {{ messageCount }} 則
     </v-btn>
     <span v-else class="text-grey-lighten-1">-</span>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  props: { params: { type: Object, required: true } },
  setup(props) {
     const messageCount = computed(() => {
        const msgs = props.params.value;
        if (!Array.isArray(msgs)) return 0;
        // 正體中文註解：只計算未被冷刪除的訊息數量
        return msgs.filter(m => !m.isDeleted).length;
     });
     const onClick = () => {
        if (props.params.colDef.cellRendererParams && props.params.colDef.cellRendererParams.onClick) {
           props.params.colDef.cellRendererParams.onClick(props.params.data);
        }
     };
     return { messageCount, onClick };
  }
};
</script>
