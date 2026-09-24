import QRCode from 'qrcode';

export function customerFormProjects(permissions = {}, projects = []) {
  return Object.entries(permissions || {})
    .filter(([, permission]) => ['客資系統-櫃台', '客資系統-銷售'].some(system => permission?.systems?.includes(system)))
    .map(([id, permission]) => ({ id, name: projects.find(project => project.id === id)?.name || permission.projectName || id }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

export function customerFormUrl(baseUrl, projectId, user, projectName) {
  if (!projectId || !user?.key || !user?.name) return '';
  const url = new URL(baseUrl);
  url.search = '';
  const query = new URLSearchParams({ sp: user.key, sn: user.name });
  if (projectName) query.set('pn', projectName);
  url.hash = `/customer-data-sheet/${encodeURIComponent(projectId)}?${query}`;
  return url.href;
}

// Keep a four-module quiet zone and a small label; full names remain available below the QR.
export async function customerFormQr(url, projectName, userName) {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, url, {
    width: 840, margin: 4, errorCorrectionLevel: 'H',
    color: { dark: '#233e34', light: '#ffffff' },
  });
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  // Fit at the original size first, then double both text and available width.
  // Size the white nameplate to the actual labels to avoid covering extra QR modules.
  const fit = (text) => {
    const maxWidth = w * .225;
    let size = 30;
    const measure = () => { ctx.font = `600 ${size}px system-ui, sans-serif`; };
    measure();
    while (size > 18 && ctx.measureText(text).width > maxWidth) {
      size -= 1;
      measure();
    }
    let label = String(text);
    while (ctx.measureText(label).width > maxWidth && label.length > 1) label = label.slice(0, -2) + '…';
    ctx.font = `600 ${size * 2}px system-ui, sans-serif`;
    return { label, size: size * 2, width: ctx.measureText(label).width };
  };
  const labels = [fit(projectName), fit(userName)];
  const labelWidth = Math.max(...labels.map(label => label.width)) + 24;
  const labelHeight = 156;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect((w - labelWidth) / 2, (w - labelHeight) / 2, labelWidth, labelHeight);
  ctx.fillStyle = '#233e34';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labels.forEach(({ label, size }, index) => {
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.fillText(label, w / 2, w / 2 + (index === 0 ? -36 : 36));
  });
  return canvas.toDataURL('image/png');
}
