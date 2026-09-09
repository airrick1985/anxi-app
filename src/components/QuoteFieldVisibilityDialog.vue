<template>
  <v-dialog
    v-model="open"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : 860"
    persistent
    no-click-animation
    :retain-focus="false"
    content-class="qfv-dialog"
  >
    <div class="qfv-window" :class="{ 'qfv-window--mobile': isMobile }">
      <!-- 標題列 -->
      <div class="qfv-titlebar">
        <div class="qfv-lights">
          <button class="qfv-light qfv-light--close" title="關閉" @click="requestClose">
            <svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" /></svg>
          </button>
        </div>
        <div class="qfv-title">
          <v-icon size="14" class="mr-1" color="rgba(0,0,0,.55)">mdi-eye-settings-outline</v-icon>
          報價顯示
          <span class="qfv-title-sub">— {{ unit?.unitId || '' }}</span>
        </div>
        <div class="qfv-title-right">
          <span v-if="overrideCount > 0" class="qfv-badge">{{ overrideCount }} 項自訂</span>
          <span v-else class="qfv-meta">依專案預設</span>
        </div>
      </div>

      <div class="qfv-body">
        <!-- 左：分組開關 -->
        <section class="qfv-panel qfv-panel--toggles">
          <div v-for="g in QUOTE_FIELD_GROUPS" :key="g.key" class="qfv-group">
            <div class="qfv-group-title">
              <v-icon size="14" class="mr-1" color="rgba(0,0,0,.5)">{{ g.icon }}</v-icon>{{ g.title }}
            </div>
            <div class="qfv-rows">
              <label
                v-for="it in g.items"
                :key="it.key"
                class="qfv-row"
                :class="{ 'qfv-row--custom': isCustom(it.key) }"
              >
                <span class="qfv-row-main">
                  <span class="qfv-dot" :title="isCustom(it.key) ? '與專案預設不同' : ''"></span>
                  <span class="qfv-row-label">{{ it.label }}</span>
                  <span v-if="it.hint" class="qfv-row-hint">{{ it.hint }}</span>
                </span>
                <span class="qfv-switch">
                  <input type="checkbox" :checked="effective[it.key]" @change="toggle(it.key, $event.target.checked)" />
                  <span class="qfv-switch-track"><span class="qfv-switch-knob"></span></span>
                </span>
              </label>
            </div>
          </div>
        </section>

        <!-- 右：即時預覽 -->
        <section class="qfv-panel qfv-panel--preview">
          <div class="qfv-preview-title">報價系統看到的樣子</div>

          <!-- 網格卡片 -->
          <div class="qfv-card" :style="{ backgroundColor: cardColor }">
            <div v-if="effective.unitTags && tags.length" class="qfv-card-tags">
              <span v-for="(t, i) in tags.slice(0, 2)" :key="i" class="qfv-card-tag" :style="{ backgroundColor: t.bgColor, color: t.textColor }">{{ t.text }}</span>
              <span v-if="tags.length > 2" class="qfv-card-tag qfv-card-tag--more">+{{ tags.length - 2 }}</span>
            </div>
            <div class="qfv-card-name">
              {{ unit?.unitId }}
              <span v-if="effective.areaTerrace && terrace > 0" class="qfv-card-terrace">露台</span>
            </div>
            <div class="qfv-card-price" :class="{ 'qfv-card-price--muted': !effective.priceTotal }">
              {{ effective.priceTotal ? `${fmt(total)} 萬` : '面議' }}
            </div>
            <div class="qfv-card-area">{{ effective.areaTotal ? `${unit?.area_house_ping ?? '-'} 坪` : ' ' }}</div>
            <div class="qfv-card-unit">{{ effective.priceTotal && effective.unitPrice ? unitPriceText : ' ' }}</div>
          </div>

          <!-- 詳情摘要 -->
          <div class="qfv-detail">
            <div class="qfv-detail-head">
              <span>{{ unit?.unitId }} 戶別資訊</span>
              <span v-if="effective.preferredPayment && unit?.isPreferredPayment" class="qfv-chip">優付</span>
            </div>
            <div class="qfv-detail-grid">
              <div class="qfv-kv">
                <span class="qfv-k">房價</span>
                <span class="qfv-v" :class="{ 'qfv-v--muted': !effective.priceTotal }">
                  {{ effective.priceTotal ? `${fmt(total)} 萬` : '面議' }}
                  <small v-if="effective.priceTotal && effective.unitPrice">({{ unitPriceText }})</small>
                </span>
              </div>
              <div v-if="effective.priceTotal && effective.priceSplit && terrace > 0" class="qfv-kv qfv-kv--sub">
                <span class="qfv-k">含露臺</span>
                <span class="qfv-v">房屋 {{ fmt(unit?.price_list_house_only) }} ＋ 露臺 {{ fmt(unit?.price_list_terrace) }} 萬</span>
              </div>
              <div v-if="effective.priceRemarks && unit?.priceRemarks" class="qfv-kv qfv-kv--sub">
                <span class="qfv-k">備註</span>
                <span class="qfv-v qfv-v--wrap">{{ unit.priceRemarks }}</span>
              </div>
              <div class="qfv-kv">
                <span class="qfv-k">房屋總面積</span>
                <span class="qfv-v">{{ effective.areaTotal ? `${fmt(unit?.area_house_ping, 2)} 坪` : '—' }}</span>
              </div>
              <div v-if="effective.areaDetail" class="qfv-kv qfv-kv--sub">
                <span class="qfv-k">明細</span>
                <span class="qfv-v">主 {{ fmt(unit?.area_main_ping, 2) }} ／ 附 {{ fmt(unit?.area_ancillary_ping, 2) }} ／ 共 {{ fmt(unit?.area_common_ping, 2) }} · 公設比 {{ pct(unit?.common_area_ratio) }}</span>
              </div>
              <div v-if="effective.areaTerrace && terrace > 0" class="qfv-kv qfv-kv--sub">
                <span class="qfv-k">露臺</span>
                <span class="qfv-v">{{ fmt(terrace, 2) }} 坪</span>
              </div>
              <div v-if="effective.landShare" class="qfv-kv qfv-kv--sub">
                <span class="qfv-k">土地持分</span>
                <span class="qfv-v">{{ fmt(unit?.land_share_ping, 2) }} 坪</span>
              </div>
              <div v-if="effective.layoutType && (unit?.layout || unit?.propertyType)" class="qfv-kv">
                <span class="qfv-k">格局／類型</span>
                <span class="qfv-v">{{ [unit?.layout, unit?.propertyType].filter(Boolean).join(' · ') }}</span>
              </div>
              <div class="qfv-kv">
                <span class="qfv-k">戶別圖片</span>
                <span class="qfv-v">{{ effective.images ? `${imageCount} 張` : '—' }}</span>
              </div>
              <div class="qfv-kv">
                <span class="qfv-k">可選方案</span>
                <span class="qfv-v">{{ effective.plans ? `${planCount} 個` : '—' }}</span>
              </div>
            </div>
            <div class="qfv-detail-foot">
              <span class="qfv-fake-btn" :class="{ 'qfv-fake-btn--off': !effective.priceTotal }">
                <v-icon size="13" class="mr-1">mdi-cart-plus</v-icon>{{ effective.priceTotal ? '加入報價' : '不提供報價' }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <!-- 底部列 -->
      <div class="qfv-foot">
        <button class="qfv-link" :disabled="overrideCount === 0 || saving" @click="resetToDefaults">還原專案預設</button>
        <button v-if="canEditProject" class="qfv-link" :disabled="saving" @click="applyAsProjectDefault">套用為專案預設</button>
        <span class="qfv-spacer"></span>
        <button class="qfv-push" :disabled="saving" @click="requestClose">取消</button>
        <button class="qfv-push qfv-push--primary" :disabled="saving || !dirty" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" class="mr-1" />儲存
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast, POSITION } from 'vue-toastification';
import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '@/firebase';
import { useUserStore } from '@/store/user';
import {
  QUOTE_FIELD_GROUPS, QUOTE_FIELD_KEYS,
  getProjectQuoteDefaults, getEffectiveQuoteFields, diffOverrides,
} from '@/utils/quoteFieldVisibility';
import { updateProjectSalesSettings } from '@/api';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  project: { type: Object, default: () => null },
  unit: { type: Object, default: () => null },
  statusColor: { type: String, default: '' },
  // 是否可「套用為專案預設」（寫入 projects/{id}.quoteFieldDefaults）
  canEditProject: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();
const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);
const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) });

const effective = ref({});
const saving = ref(false);

const projectDefaults = computed(() => getProjectQuoteDefaults(props.project));
const isCustom = (key) => effective.value[key] !== projectDefaults.value[key];
const overrideCount = computed(() => QUOTE_FIELD_KEYS.filter(isCustom).length);
const initialSnapshot = ref('');
const dirty = computed(() => JSON.stringify(effective.value) !== initialSnapshot.value);

function load() {
  effective.value = getEffectiveQuoteFields(props.unit, props.project);
  initialSnapshot.value = JSON.stringify(effective.value);
}
watch(() => props.modelValue, v => { if (v) load(); }, { immediate: true });
watch(() => props.unit, () => { if (props.modelValue) load(); });

function toggle(key, checked) {
  effective.value = { ...effective.value, [key]: !!checked };
}
function resetToDefaults() {
  effective.value = { ...projectDefaults.value };
}

// --- 預覽用 ---
const cardColor = computed(() => props.statusColor || '#ffffff');
const tags = computed(() => Array.isArray(props.unit?.unitTags) ? props.unit.unitTags.filter(t => t && t.text) : []);
const terrace = computed(() => Number(props.unit?.area_terrace_ping) || 0);
const total = computed(() => Number(props.unit?.price_list_house_total) || 0);
const imageCount = computed(() => Array.isArray(props.unit?.salesImages) ? props.unit.salesImages.length : 0);
const planCount = computed(() => Array.isArray(props.unit?.availablePlans) ? props.unit.availablePlans.length : 0);
const unitPriceText = computed(() => {
  const area = Number(props.unit?.area_house_ping) || 0;
  if (!total.value || !area) return '-';
  return `${(total.value / area).toFixed(1)} 萬/坪`;
});
const fmt = (v, p = 0) => {
  if (v === undefined || v === null || v === '') return '-';
  const n = Number(v);
  return isNaN(n) ? '-' : n.toLocaleString('zh-TW', { minimumFractionDigits: p, maximumFractionDigits: p });
};
const pct = (v) => {
  const n = Number(v);
  if (!n) return '-';
  return `${(n <= 1 ? n * 100 : n).toFixed(1)}%`;
};

// --- 儲存 ---
async function save() {
  if (!props.unit?.unitId || saving.value) return;
  saving.value = true;
  try {
    const overrides = diffOverrides(effective.value, props.project);
    const hasAny = Object.keys(overrides).length > 0;
    const ref_ = doc(db, 'salesHouseholds', `${props.projectId}_${props.unit.unitId}`);
    await updateDoc(ref_, {
      quoteFieldOverrides: hasAny ? overrides : deleteField(),
      quoteFieldOverridesUpdatedAt: hasAny ? serverTimestamp() : deleteField(),
      quoteFieldOverridesUpdatedBy: hasAny ? (userStore.user?.name || userStore.user?.displayName || userStore.user?.email || '') : deleteField(),
      updatedAt: serverTimestamp(),
    });
    emit('saved', { unitId: props.unit.unitId, overrides: hasAny ? overrides : null });
    toast.success(`${props.unit.unitId} 報價顯示已更新`, { position: POSITION.BOTTOM_CENTER, timeout: 2000 });
    open.value = false;
  } catch (err) {
    console.error('[QuoteFieldVisibility] save failed', err);
    toast.error(`儲存失敗：${err.message || '請稍後再試'}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    saving.value = false;
  }
}

async function applyAsProjectDefault() {
  if (saving.value) return;
  if (!window.confirm('把目前的開關狀態套用為「專案預設」？\n所有沒有自訂的戶別都會跟著改變。')) return;
  saving.value = true;
  try {
    const next = { ...effective.value };
    await updateProjectSalesSettings(props.projectId, {
      quoteFieldDefaults: next,
      showPreferredPaymentInQuote: next.preferredPayment === true,
    });
    // 本戶套用後即與新預設一致：清掉覆寫
    const ref_ = doc(db, 'salesHouseholds', `${props.projectId}_${props.unit.unitId}`);
    await updateDoc(ref_, {
      quoteFieldOverrides: deleteField(),
      quoteFieldOverridesUpdatedAt: deleteField(),
      quoteFieldOverridesUpdatedBy: deleteField(),
    });
    emit('saved', { unitId: props.unit.unitId, overrides: null, projectDefaults: next });
    toast.success('已套用為專案預設', { position: POSITION.BOTTOM_CENTER, timeout: 2000 });
    open.value = false;
  } catch (err) {
    console.error('[QuoteFieldVisibility] apply defaults failed', err);
    toast.error(`儲存失敗：${err.message || '請稍後再試'}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    saving.value = false;
  }
}

function requestClose() {
  if (saving.value) return;
  open.value = false;
}
</script>

<style scoped>
.qfv-window {
  --f: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --blue: #0a7aff;
  font-family: var(--f);
  font-size: 13px;
  color: #1d1d1f;
  background: #f5f5f7;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  box-shadow: 0 24px 80px rgba(0,0,0,.35), 0 0 0 .5px rgba(0,0,0,.2);
}
.qfv-window--mobile { height: 100vh; height: 100dvh; max-height: none; border-radius: 0; }

.qfv-titlebar {
  position: relative; height: 40px; display: flex; align-items: center; padding: 0 12px;
  background: linear-gradient(#ececec, #e2e2e2); border-bottom: 1px solid rgba(0,0,0,.14); flex-shrink: 0;
}
.qfv-lights { display: flex; gap: 8px; z-index: 1; }
.qfv-light { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,.15); padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.qfv-light svg { width: 8px; height: 8px; stroke: rgba(0,0,0,.55); stroke-width: 1.5; fill: none; stroke-linecap: round; opacity: 0; transition: opacity .12s; }
.qfv-lights:hover .qfv-light svg { opacity: 1; }
.qfv-light--close { background: #ff5f57; }
.qfv-title { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; font-weight: 600; color: #3a3a3c; }
.qfv-title-sub { color: rgba(0,0,0,.45); font-weight: 500; margin-left: 4px; }
.qfv-title-right { margin-left: auto; z-index: 1; }
.qfv-meta { font-size: 11px; color: rgba(0,0,0,.5); }
.qfv-badge { font-size: 11px; font-weight: 600; color: var(--blue); background: rgba(10,122,255,.12); padding: 2px 8px; border-radius: 999px; }

.qfv-body { flex: 1; min-height: 0; display: flex; overflow: hidden; }
.qfv-window--mobile .qfv-body { flex-direction: column; overflow-y: auto; }
.qfv-panel { padding: 14px 16px; overflow-y: auto; }
.qfv-panel--toggles { flex: 1 1 0; min-width: 0; }
.qfv-panel--preview { width: 340px; flex-shrink: 0; background: #ebebed; border-left: 1px solid rgba(0,0,0,.1); }
.qfv-window--mobile .qfv-panel { overflow: visible; }
.qfv-window--mobile .qfv-panel--preview { width: 100%; border-left: none; border-top: 1px solid rgba(0,0,0,.1); }

.qfv-group + .qfv-group { margin-top: 14px; }
.qfv-group-title { font-size: 11px; font-weight: 700; letter-spacing: .04em; color: rgba(0,0,0,.5); text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; }
.qfv-rows { background: #fff; border-radius: 10px; border: 1px solid rgba(0,0,0,.08); overflow: hidden; }
.qfv-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; cursor: pointer; gap: 10px; }
.qfv-row + .qfv-row { border-top: 1px solid rgba(0,0,0,.06); }
.qfv-row:hover { background: rgba(0,0,0,.025); }
.qfv-row-main { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
.qfv-dot { width: 7px; height: 7px; border-radius: 50%; background: transparent; flex-shrink: 0; }
.qfv-row--custom .qfv-dot { background: var(--blue); box-shadow: 0 0 0 3px rgba(10,122,255,.18); }
.qfv-row-label { font-weight: 500; }
.qfv-row-hint { font-size: 11px; color: rgba(0,0,0,.45); }

.qfv-switch { display: inline-flex; flex-shrink: 0; }
.qfv-switch input { display: none; }
.qfv-switch-track { width: 34px; height: 20px; border-radius: 999px; background: rgba(0,0,0,.2); position: relative; transition: background .15s; }
.qfv-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: left .15s; }
.qfv-switch input:checked + .qfv-switch-track { background: #34c759; }
.qfv-switch input:checked + .qfv-switch-track .qfv-switch-knob { left: 16px; }

.qfv-preview-title { font-size: 11px; font-weight: 700; color: rgba(0,0,0,.5); letter-spacing: .04em; margin-bottom: 8px; }
.qfv-card {
  position: relative; width: 132px; height: 96px; margin: 0 auto 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,.14);
  display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,.12);
}
.qfv-card-tags { position: absolute; top: 4px; right: 4px; display: flex; gap: 2px; }
.qfv-card-tag { font-size: 9px; line-height: 1; padding: 2px 4px; border-radius: 4px; font-weight: 600; }
.qfv-card-tag--more { background: rgba(0,0,0,.35); color: #fff; }
.qfv-card-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 4px; }
.qfv-card-terrace { font-size: 9px; padding: 1px 4px; border-radius: 4px; background: #00897b; color: #fff; font-weight: 600; }
.qfv-card-price { font-size: 13px; font-weight: 700; color: #1a237e; margin-top: 2px; }
.qfv-card-price--muted { color: rgba(0,0,0,.45); font-weight: 600; }
.qfv-card-area { font-size: 11px; color: rgba(0,0,0,.65); }
.qfv-card-unit { font-size: 10px; color: rgba(0,0,0,.5); }

.qfv-detail { background: #fff; border-radius: 10px; border: 1px solid rgba(0,0,0,.08); overflow: hidden; }
.qfv-detail-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f0f0f2; font-weight: 600; font-size: 12px; }
.qfv-chip { font-size: 10px; font-weight: 700; color: #fff; background: #1976d2; padding: 1px 7px; border-radius: 999px; }
.qfv-detail-grid { padding: 6px 12px; }
.qfv-kv { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px dashed rgba(0,0,0,.07); font-size: 12px; }
.qfv-kv:last-child { border-bottom: none; }
.qfv-kv--sub { padding-left: 10px; font-size: 11px; color: rgba(0,0,0,.6); }
.qfv-k { color: rgba(0,0,0,.5); min-width: 64px; flex-shrink: 0; }
.qfv-v { font-weight: 600; min-width: 0; }
.qfv-v small { font-weight: 400; color: rgba(0,0,0,.5); margin-left: 4px; }
.qfv-v--muted { color: rgba(0,0,0,.45); }
.qfv-v--wrap { white-space: pre-wrap; word-break: break-word; font-weight: 400; }
.qfv-detail-foot { padding: 8px 12px; border-top: 1px solid rgba(0,0,0,.06); display: flex; justify-content: flex-end; }
.qfv-fake-btn { display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; color: #fff; background: #2e7d32; padding: 4px 10px; border-radius: 6px; }
.qfv-fake-btn--off { background: rgba(0,0,0,.25); }

.qfv-foot { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid rgba(0,0,0,.1); background: #f5f5f7; flex-shrink: 0; flex-wrap: wrap; }
.qfv-spacer { flex: 1; }
.qfv-link { background: none; border: none; color: var(--blue); font-family: var(--f); font-size: 12px; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
.qfv-link:hover:not(:disabled) { background: rgba(10,122,255,.08); }
.qfv-link:disabled { color: rgba(0,0,0,.3); cursor: default; }
.qfv-push {
  height: 28px; padding: 0 14px; border-radius: 7px; border: 1px solid rgba(0,0,0,.16);
  background: linear-gradient(#fff, #f2f2f2); color: #1d1d1f; font-family: var(--f); font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 1px rgba(0,0,0,.06);
}
.qfv-push:hover:not(:disabled) { background: linear-gradient(#fafafa, #e9e9e9); }
.qfv-push:disabled { opacity: .45; cursor: default; }
.qfv-push--primary { background: linear-gradient(#2f8dff, var(--blue)); border-color: #0a6ae0; color: #fff; font-weight: 600; }
.qfv-push--primary:hover:not(:disabled) { background: linear-gradient(#2a82ee, #0a6ae0); }
</style>

<style>
.qfv-dialog { box-shadow: none !important; overflow: visible !important; }
</style>
