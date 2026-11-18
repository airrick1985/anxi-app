// QR Code 產生：qrcode 套件用動態 import，開分享面板或捲到最終區才載入
let qrModule = null;

export async function makeQr(text, width = 360) {
  try {
    qrModule = qrModule || (await import('qrcode'));
    const QRCode = qrModule.default || qrModule;
    return await QRCode.toDataURL(text, {
      margin: 1,
      width,
      errorCorrectionLevel: 'M',
      color: { dark: '#0B0B0F', light: '#FFFFFF' },
    });
  } catch (e) {
    console.warn('[ProductPage] QR Code 產生失敗:', e);
    return '';
  }
}
