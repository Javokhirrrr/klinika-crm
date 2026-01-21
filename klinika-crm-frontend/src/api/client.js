const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';


function getToken() {
try {
return localStorage.getItem('accessToken') || '';
} catch {
return '';
}
}


export async function api(path, { method = 'GET', body, headers } = {}) {
const res = await fetch(`${API_BASE}${path}`, {
method,
headers: {
'Content-Type': 'application/json',
...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
...(headers || {}),
},
body: body ? JSON.stringify(body) : undefined,
});


if (res.status === 401) {
// Token eskirgan bo'lsa — logout
localStorage.removeItem('accessToken');
window.location.href = '/login';
return;
}


const ct = res.headers.get('content-type') || '';
if (ct.includes('application/json')) {
const data = await res.json();
if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
return data;
} else {
if (!res.ok) throw new Error(`HTTP ${res.status}`);
return res; // masalan: PDF va h.k.
}
}


export function setToken(token) {
localStorage.setItem('accessToken', token);
}