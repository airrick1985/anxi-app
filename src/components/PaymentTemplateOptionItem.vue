<template>
  <!--
    期款方式選單的單一選項（報價單設定 QuoteItem 與 製作付款表 PaymentSchedulePreviewDialog 共用）
    用法：<template #item="{ props, item }"><PaymentTemplateOptionItem v-bind="props" :option="item.raw" /></template>
    option 由 utils/paymentTemplateMatch.buildTemplateOptionList 產生
  -->
  <v-list-item
    v-bind="$attrs"
    class="tpl-opt"
    :class="{ 'tpl-opt-bad': option.reasons.length, 'tpl-opt-locked': option.disabled }"
  >
    <template v-slot:prepend>
      <v-icon
        size="20"
        :color="option.reasons.length ? (option.disabled ? 'grey' : 'orange-darken-2') : 'green-darken-1'"
        class="tpl-opt-icon"
      >
        {{ option.reasons.length ? (option.disabled ? 'mdi-lock-outline' : 'mdi-lock-open-variant-outline') : 'mdi-check-circle' }}
      </v-icon>
    </template>
    <template v-slot:title>
      <span class="tpl-opt-title">{{ option.templateName }}</span>
      <span v-if="option.isAuto" class="tpl-tag tpl-tag-auto">自動判斷</span>
    </template>
    <template v-slot:subtitle>
      <span class="tpl-opt-tags">
        <span class="tpl-tag" :class="{ 'tpl-tag-bad': option.badKeys.includes('propertyType') }">{{ option.propertyType }}</span>
        <span class="tpl-tag" :class="{ 'tpl-tag-bad': option.badKeys.includes('buyerType') }">{{ option.buyerType }}</span>
        <span class="tpl-tag" :class="{ 'tpl-tag-bad': option.badKeys.includes('price') }">{{ option.priceRange }}</span>
        <span v-if="option.itemCount" class="tpl-tag tpl-tag-muted">{{ option.itemCount }} 個期款項目</span>
      </span>
      <span v-if="option.reasonText" class="tpl-opt-reason">{{ option.reasonText }}</span>
    </template>
  </v-list-item>
</template>

<script setup>
defineOptions({ inheritAttrs: false });
defineProps({
  option: { type: Object, required: true }
});
</script>

<style>
/* 非 scoped：v-select 選單掛在 overlay 容器下，scoped 不生效；一律以 .tpl-menu / .tpl-opt 前綴限定範圍 */
.tpl-menu .tpl-group-header {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  min-height: 30px;
  padding-inline-start: 14px !important;
}
.tpl-menu .tpl-group-ok { color: #2e7d32; background-color: rgba(76, 175, 80, 0.08); }
.tpl-menu .tpl-group-bad { color: #757575; background-color: rgba(158, 158, 158, 0.12); }
.tpl-menu .tpl-group-unlocked { color: #e65100; background-color: rgba(255, 152, 0, 0.1); }

.tpl-opt {
  padding-block: 8px;
  align-items: flex-start;
}
.tpl-opt .v-list-item__prepend { padding-top: 2px; }
.tpl-opt .tpl-opt-icon { margin-inline-end: 4px; }
.tpl-opt .v-list-item__spacer { width: 8px !important; }
.tpl-opt .v-list-item-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  white-space: normal;
  line-height: 1.3;
}
.tpl-opt .tpl-opt-title { font-weight: 600; font-size: 0.92rem; }
.tpl-opt .v-list-item-subtitle {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
  text-overflow: clip;
  opacity: 1;
  white-space: normal;
  line-height: 1.4;
  margin-top: 4px;
}
.tpl-opt .tpl-opt-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tpl-opt .tpl-tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  line-height: 1.5;
  background-color: #eceff1;
  color: #455a64;
  white-space: nowrap;
}
.tpl-opt .tpl-tag-muted { background-color: transparent; color: #90a4ae; padding-inline: 2px; }
.tpl-opt .tpl-tag-auto { background-color: #e3f2fd; color: #1565c0; font-weight: 600; }
.tpl-opt .tpl-tag-bad {
  background-color: #ffebee;
  color: #c62828;
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}
.tpl-opt .tpl-opt-reason {
  display: block;
  margin-top: 3px;
  font-size: 0.72rem;
  color: #c62828;
}
.tpl-opt.tpl-opt-bad .tpl-opt-title { color: #616161; }
/* 未解鎖的條件外選項：整體淡化，但原因文字保持可讀 */
.tpl-opt.tpl-opt-locked.v-list-item--disabled { opacity: 0.55; }
.tpl-opt.tpl-opt-locked .tpl-opt-reason { color: #8d6e63; }
</style>
