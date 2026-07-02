const BASE = 'http://localhost:8000';

export async function register(data: {
  name: string;
  phone: string;
  email: string;
  business_name: string;
  rubro: string;
}) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrarse');
  return res.json();
}

export async function sendChat(session_token: string, message: string, image_url?: string | null) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token, message, image_url: image_url || null }),
  });
  if (!res.ok) throw new Error('Error al enviar mensaje');
  return res.json();
}

export async function uploadImage(session_token: string, file: File) {
  const form = new FormData();
  form.append('session_token', session_token);
  form.append('file', file);
  const res = await fetch(`${BASE}/chat/upload-image`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Error al subir imagen');
  return res.json();
}

export async function getHistory(session_token: string) {
  const res = await fetch(`${BASE}/chat/history?session_token=${session_token}`);
  if (!res.ok) throw new Error('Error al cargar historial');
  return res.json();
}

export async function login(email: string) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Usuario no encontrado');
  return res.json();
}
