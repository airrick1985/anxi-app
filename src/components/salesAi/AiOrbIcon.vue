<template>
  <div class="ai-orb" :class="[`ai-orb--${state}`, { 'ai-orb--close': showClose }]" :style="{ '--size': `${size}px` }" aria-hidden="true">
    <svg v-if="!showClose" viewBox="0 0 100 100" class="ai-orb__svg">
      <defs>
        <radialGradient :id="gradId" cx="40%" cy="35%" r="65%">
          <stop offset="0" stop-color="#9FF7FF" /><stop offset="0.45" stop-color="#2F6BFF" /><stop offset="1" stop-color="#0B1B3A" />
        </radialGradient>
      </defs>
      <g class="ai-orb__ring ai-orb__ring--a">
        <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#00E5FF" :stroke-width="ringWidth" opacity="0.9" transform="rotate(-28 50 50)" />
        <circle r="4" fill="#FFFFFF">
          <animateMotion :dur="satelliteDur" repeatCount="indefinite" path="M92,50 a42,14 0 1,0 -84,0 a42,14 0 1,0 84,0" />
        </circle>
      </g>
      <g class="ai-orb__ring ai-orb__ring--b">
        <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#7C4DFF" :stroke-width="ringWidth" opacity="0.85" transform="rotate(52 50 50)" />
      </g>
      <circle class="ai-orb__core" cx="50" cy="50" :r="coreR" :fill="`url(#${gradId})`" />
      <circle cx="44" cy="43" r="4" fill="#fff" opacity="0.7" />
    </svg>
    <svg v-else viewBox="0 0 100 100" class="ai-orb__svg">
      <path d="M30 30 L70 70 M70 30 L30 70" stroke="#E8F4FF" stroke-width="9" stroke-linecap="round" fill="none" />
    </svg>
    <span v-if="badge" class="ai-orb__badge">{{ badge > 9 ? '9+' : badge }}</span>
  </div>
</template>

<script setup>
// 銷控智能助理 ICON（A 款：核心＋雙軌道環），docs/銷控AI智能助理-spec.md §3.1
// state: idle | thinking | needsInput | error | disabled
import { computed } from 'vue';

const props = defineProps({
  size: { type: Number, default: 56 },
  state: { type: String, default: 'idle' },
  badge: { type: Number, default: 0 },
  showClose: { type: Boolean, default: false },
});
const gradId = `ai-orb-core-${Math.random().toString(36).slice(2, 8)}`;
const ringWidth = computed(() => (props.size <= 40 ? 3.6 : props.size <= 64 ? 3 : 2.2));
const coreR = computed(() => (props.size <= 64 ? 18 : 17));
const satelliteDur = computed(() => (props.state === 'thinking' ? '2s' : '8s'));
</script>

<style scoped>
@property --ai-orb-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }

.ai-orb {
  --spd: 8s;
  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #1E3A78 0%, #0B1B3A 62%, #030814 100%);
  box-shadow: 0 0 18px 4px rgba(47, 107, 255, 0.45), 0 0 40px 10px rgba(0, 229, 255, 0.18), inset 0 0 12px rgba(0, 229, 255, 0.25);
  animation: ai-orb-breathe 3s ease-in-out infinite;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.ai-orb::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  padding: 2px;
  background: conic-gradient(from var(--ai-orb-angle), #2F6BFF, #00E5FF, #7C4DFF, #2F6BFF);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: ai-orb-spin 6s linear infinite;
  pointer-events: none;
}
.ai-orb__svg { width: 78%; height: 78%; overflow: visible; display: block; }
.ai-orb__ring { transform-box: fill-box; transform-origin: center; animation: ai-orb-orbit var(--spd) linear infinite; }
.ai-orb__ring--b { animation-name: ai-orb-orbit-r; animation-duration: calc(var(--spd) * 1.6); }
.ai-orb__core { transform-box: fill-box; transform-origin: center; animation: ai-orb-pulse 2.4s ease-in-out infinite; }

.ai-orb--thinking { --spd: 2s; box-shadow: 0 0 24px 8px rgba(47, 107, 255, 0.6), 0 0 60px 16px rgba(0, 229, 255, 0.28), inset 0 0 14px rgba(0, 229, 255, 0.4); animation-duration: 1.2s; }
.ai-orb--thinking::before { animation-duration: 1.5s; }
.ai-orb--needsInput { box-shadow: 0 0 18px 4px rgba(255, 179, 0, 0.55), 0 0 44px 10px rgba(255, 179, 0, 0.22), inset 0 0 12px rgba(255, 204, 128, 0.3); }
.ai-orb--needsInput::before { background: conic-gradient(from var(--ai-orb-angle), #FFB300, #FFE082, #FF8F00, #FFB300); }
.ai-orb--error { box-shadow: 0 0 18px 4px rgba(229, 57, 53, 0.55), 0 0 44px 10px rgba(229, 57, 53, 0.22); }
.ai-orb--error::before { background: conic-gradient(from var(--ai-orb-angle), #E53935, #FF8A80, #B71C1C, #E53935); }
.ai-orb--disabled { filter: grayscale(1) brightness(0.8); animation: none; box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.25); }
.ai-orb--disabled::before, .ai-orb--disabled .ai-orb__ring, .ai-orb--disabled .ai-orb__core { animation: none; }
.ai-orb--close { --spd: 30s; }

.ai-orb__badge {
  position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: #E53935; color: #fff; font: 700 11px/18px system-ui, sans-serif; text-align: center;
  box-shadow: 0 0 0 2px #fff;
}

@keyframes ai-orb-spin { to { --ai-orb-angle: 360deg; } }
@keyframes ai-orb-breathe { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.18); } }
@keyframes ai-orb-orbit { to { transform: rotate(360deg); } }
@keyframes ai-orb-orbit-r { to { transform: rotate(-360deg); } }
@keyframes ai-orb-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.12); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .ai-orb, .ai-orb::before, .ai-orb__ring, .ai-orb__core { animation: none !important; }
}
</style>
