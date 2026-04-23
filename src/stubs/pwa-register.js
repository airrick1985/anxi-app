// No-op stub for `virtual:pwa-register` (原本由 vite-plugin-pwa 提供)。
// 我們已停用 PWA；保留這個 stub 讓 main.js 等既有 import 不需動，registerSW 呼叫變成 no-op。
export function registerSW() {
  return async () => {};
}
