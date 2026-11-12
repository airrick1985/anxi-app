<template>
  <!-- 欄位大綱（遞迴）：一層一個可拖曳清單；選項底下的追問欄位縮排顯示，讓使用者看得到自己在表單的哪一層 -->
  <draggable
    :list="list"
    item-key="id"
    handle=".dfo-grip"
    :animation="160"
    ghost-class="dfo-ghost"
    class="dfo"
  >
    <template #item="{ element: field, index }">
      <div class="dfo-item">
        <div
          class="dfo-row"
          :class="{ 'is-active': field.id === selectedId }"
          role="button"
          tabindex="0"
          @click="emit('select', field.id)"
          @keydown.enter="emit('select', field.id)"
        >
          <span class="dfo-grip" title="拖曳排序" @click.stop><v-icon size="16">mdi-drag-vertical</v-icon></span>
          <span class="dfo-no">{{ index + 1 }}</span>
          <v-icon size="16" class="dfo-icon">{{ fieldTypeIcon(field) }}</v-icon>
          <span class="dfo-name" :class="{ 'is-empty': !field.label }">{{ field.label || '未命名' }}<span v-if="field.required" class="dfo-req">*</span></span>
          <v-icon size="16" class="dfo-chev">mdi-chevron-right</v-icon>
        </div>

        <template v-for="option in field.options || []" :key="option.id || option.value">
          <div v-if="option.subFields && option.subFields.length > 0" class="dfo-branch">
            <div class="dfo-branch-head">
              <v-icon size="14">mdi-subdirectory-arrow-right</v-icon>
              <span class="dfo-branch-name">選「{{ option.label }}」時</span>
              <button
                type="button"
                class="mac-icon-btn dfo-branch-add"
                :title="`在「${option.label}」底下加入欄位`"
                :aria-label="`在「${option.label}」底下加入欄位`"
                @click.stop="emit('add', $event, option)"
              ><v-icon size="16">mdi-plus</v-icon></button>
            </div>
            <DynamicFieldOutline
              :list="option.subFields"
              :selected-id="selectedId"
              @select="id => emit('select', id)"
              @add="(evt, opt) => emit('add', evt, opt)"
            />
          </div>
        </template>
      </div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import { fieldTypeIcon } from '@/utils/dynamicFieldTypes';

defineOptions({ name: 'DynamicFieldOutline' });

defineProps<{
  list: any[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'add', evt: Event, option: any): void;
}>();
</script>

<style scoped>
.dfo { display: flex; flex-direction: column; gap: 1px; min-height: 4px; }
.dfo-row {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  min-height: 32px;
  padding: 6px 6px 6px 2px;
  border-radius: 7px;
  color: #1d1d1f;
  font-size: 13.5px;
  line-height: 1.4;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.dfo-row:hover { background: rgba(0, 0, 0, 0.045); }
.dfo-row.is-active { background: #0a6fdc; color: #fff; }
.dfo-row:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.45); outline-offset: -2px; }
.dfo-grip {
  display: inline-grid;
  place-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 20px;
  color: #b0b0b6;
  cursor: grab;
  touch-action: none;
}
.dfo-no {
  flex-shrink: 0;
  min-width: 16px;
  color: #8e8e93;
  font-size: 12px;
  line-height: 20px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.dfo-icon { flex-shrink: 0; margin-top: 2px; color: #6e6e73; }
.dfo-name { flex: 1 1 auto; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.dfo-name.is-empty { color: #8e8e93; font-weight: 400; }
.dfo-req { margin-left: 2px; color: #d62d20; font-weight: 700; }
.dfo-chev { display: none; flex-shrink: 0; margin-top: 2px; color: #c7c7cc; }
.dfo-row.is-active .dfo-grip,
.dfo-row.is-active .dfo-no,
.dfo-row.is-active .dfo-icon,
.dfo-row.is-active .dfo-req,
.dfo-row.is-active .dfo-name.is-empty { color: rgba(255, 255, 255, 0.85); }

.dfo-branch {
  margin: 1px 0 3px 20px;
  padding-left: 6px;
  border-left: 1.5px solid #d8d8dd;
}
.dfo-branch-head {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
  padding-left: 2px;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 600;
}
.dfo-branch-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.dfo-branch-add { width: 24px; height: 24px; }
.dfo-ghost { opacity: 0.4; }
</style>

<style>
/* 手機（清單／編輯分頁切換）時：列加高好點、顯示右箭頭表示可進入 */
.dfe--compact .dfo-row { min-height: 44px; padding-top: 11px; padding-bottom: 11px; font-size: 15px; }
.dfe--compact .dfo-row.is-active { background: transparent; color: #1d1d1f; }
.dfe--compact .dfo-row.is-active .dfo-grip { color: #b0b0b6; }
.dfe--compact .dfo-row.is-active .dfo-no { color: #8e8e93; }
.dfe--compact .dfo-row.is-active .dfo-icon { color: #6e6e73; }
.dfe--compact .dfo-row.is-active .dfo-req { color: #d62d20; }
.dfe--compact .dfo-chev { display: inline-flex; }
.dfe--compact .dfo-grip { width: 26px; height: 22px; }
.dfe--compact .dfo-branch-add { width: 32px; height: 32px; }
</style>
