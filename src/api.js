// src/api.js
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz5lJN8Ep66o7JktZf6FYXzLOPv9KP5-ihLbSRqoBqh4RmhebjmQ3QTiCcTthhXJwg2/exec';

export async function loginUser(name, password) {
  const params = new URLSearchParams({ name, password });
  const res = await fetch(GAS_URL + '?' + params.toString());
  return await res.json();
}
