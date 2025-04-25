export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
    const { name, password } = req.body;
    const gasUrl = 'https://script.google.com/macros/s/AKfycbz5lJN8Ep66o7JktZf6FYXzLOPv9KP5-ihLbSRqoBqh4RmhebjmQ3QTiCcTthhXJwg2/exec';
  
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
  
      const text = await response.text();
      console.log('GAS 回傳內容：', text);
  
      const json = JSON.parse(text); // 如果 text 是 HTML 會在這邊錯
      return res.status(200).json(json);
    } catch (err) {
      console.error('Proxy 伺服器錯誤：', err.message);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }
  