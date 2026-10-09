// 賞屋預約權限：可進入的建案、是否直接進個人頁
export const VIEWING_SYSTEMS = ['客資系統-櫃台', '客資系統-銷售'];

// 使用者具「客資系統-櫃台」或「客資系統-銷售」權限的建案 [{ id, name }]
export function getViewingProjects(userStore, projectStore) {
  const permissions = userStore.user?.permissions || {};
  return Object.keys(permissions)
    .filter(id => (permissions[id]?.systems || []).some(sys => VIEWING_SYSTEMS.includes(sys)))
    .map(id => ({ id, name: projectStore.idToNameMap[id] || permissions[id].projectName || id }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

// 有任一建案「客資系統-銷售」權限 → 賞屋預約預設進「我的賞屋預約」
export function prefersMyViewingReservations(userStore) {
  return userStore.hasPermission('客資系統-銷售');
}
