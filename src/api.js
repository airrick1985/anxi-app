const PROXY_API = 'https://vercel-proxy-api2.vercel.app/api/login';

export async function loginUser(name, password) {
  try {
    const response = await fetch(PROXY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });

    return await response.json();
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}