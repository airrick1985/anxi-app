import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec'; // ⚡換成你的GAS Web App URL

export default async function handler(req, res) {
  // 加入 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 預檢請求處理（OPTIONS）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 必須是 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_house_detail', // ⚡傳給 GAS 讓後端知道要做哪個功能
        unit: req.body.unit,         // 轉送 unit 參數
        token: req.body.token        // 轉送 token 參數
      })
    });

    const text = await response.text();
    console.log('GAS 回傳:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('GAS 回傳格式錯誤:', text);
      return res.status(500).json({ status: 'error', message: 'GAS 回傳不是有效 JSON' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy get-house-detail 錯誤:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
