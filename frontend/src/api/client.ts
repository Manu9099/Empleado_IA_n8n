const BASE = 'http://localhost:8000';

export interface BusinessProfilePayload {
  session_token: string;
  tone?: string;
  description?: string;
  address?: string;
  opening_hours?: string;
  services?: any[];
  faq?: any[];
  rules?: string[];
  booking_enabled?: boolean;
  reminders_enabled?: boolean;
  whatsapp_enabled?: boolean;
}

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

export async function login(email: string) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw new Error('Usuario no encontrado');
  return res.json();
}

export async function sendChat(
  session_token: string,
  message: string,
  image_url?: string | null
) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_token,
      message,
      image_url: image_url || null,
    }),
  });

  if (!res.ok) throw new Error('Error al enviar mensaje');
  return res.json();
}

export async function uploadImage(session_token: string, file: File) {
  const form = new FormData();
  form.append('session_token', session_token);
  form.append('file', file);

  const res = await fetch(`${BASE}/chat/upload-image`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error('Error al subir imagen');
  return res.json();
}

export async function getHistory(session_token: string) {
  const res = await fetch(
    `${BASE}/chat/history?session_token=${encodeURIComponent(session_token)}`
  );

  if (!res.ok) throw new Error('Error al cargar historial');
  return res.json();
}

export async function getBusinessProfile(session_token: string) {
  const res = await fetch(
    `${BASE}/business-profile?session_token=${encodeURIComponent(session_token)}`
  );

  if (!res.ok) throw new Error('Error al cargar perfil del negocio');
  return res.json();
}

export async function updateBusinessProfile(data: BusinessProfilePayload) {
  const res = await fetch(`${BASE}/business-profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Error al actualizar perfil del negocio');
  return res.json();
}