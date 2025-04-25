export default async function handler(req, res) {
    console.log('🔵 New login request:', req.method);
  
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    const { name, password } = req.body;
    const gasUrl = 'https://script.google.com/macros/s/AKfycbz5lJN8Ep66o7JktZf6FYXzLOPv9KP5-ihLbSRqoBqh4RmhebjmQ3QTiCcTthhXJwg2/exec';
  
    try {
      const gasResponse = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
  
      const text = await gasResponse.text();
      console.log('🟢 GAS raw response:', text);
  
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        throw new Error('GAS 回傳非 JSON：' + text.slice(0, 100));
      }
  
      return res.status(200).json(result);
    } catch (err) {
      console.error('🔴 Proxy error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }
  