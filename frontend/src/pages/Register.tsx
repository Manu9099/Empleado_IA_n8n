import React, { useState } from 'react';
import { register, login } from '../api/client';
import './Register.css';

const RUBROS = [
  'Abogacía', 'Medicina', 'Odontología', 'Psicología',
  'Construcción', 'Joyería', 'Belleza', 'Educación',
  'Contabilidad', 'Otro',
];

const createSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface Props {
  onSuccess: (token: string, name: string, business: string) => void;
}

export default function Register({ onSuccess }: Props) {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [slugTouched, setSlugTouched] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    business_name: '',
    business_slug: '',
    rubro: '',
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBusinessNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      business_name: value,
      business_slug: slugTouched ? prev.business_slug : createSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setForm(prev => ({
      ...prev,
      business_slug: createSlug(value),
    }));
  };

  const handleRegister = async () => {
    if (
      !form.name ||
      !form.phone ||
      !form.email ||
      !form.business_name ||
      !form.business_slug ||
      !form.rubro
    ) {
      setError('Completa todos los campos');
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.business_slug)) {
      setError('El slug solo puede tener letras, números y guiones');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await register(form);

      const finalBusinessSlug = res.business_slug || form.business_slug;

      localStorage.clear();
      localStorage.setItem('session_token', res.session_token);
      localStorage.setItem('user_name', form.name);
      localStorage.setItem('business_name', form.business_name);
      localStorage.setItem('business_slug', finalBusinessSlug);

      onSuccess(res.session_token, form.name, form.business_name);
    } catch {
      setError('Ocurrió un error, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail) {
      setError('Ingresa tu correo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(loginEmail);

      localStorage.clear();
      localStorage.setItem('session_token', res.session_token);
      localStorage.setItem('user_name', res.user_name);
      localStorage.setItem('business_name', res.business_name);

      if (res.business_slug) {
        localStorage.setItem('business_slug', res.business_slug);
      }

      onSuccess(res.session_token, res.user_name, res.business_name);
    } catch {
      setError('Correo no encontrado. ¿Ya tienes cuenta?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen">
      <div className="register-card">
        <div className="register-logo">
          <span className="logo-icon">⚡</span>
          <h1>Empleado IA</h1>
          <p>Tu asistente de negocio inteligente</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Registro
          </button>

          <button
            className={`tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Ingresar
          </button>
        </div>

        {tab === 'register' ? (
          <div className="register-fields">
            <input
              placeholder="Tu nombre"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Teléfono"
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />

            <input
              placeholder="Correo electrónico"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />

            <input
              placeholder="Nombre del negocio"
              value={form.business_name}
              onChange={e => handleBusinessNameChange(e.target.value)}
            />

            <input
              placeholder="Slug del negocio, ejemplo: joyeria-luna"
              value={form.business_slug}
              onChange={e => handleSlugChange(e.target.value)}
            />

            <select
              value={form.rubro}
              onChange={e => setForm({ ...form, rubro: e.target.value })}
            >
              <option value="">Selecciona tu rubro</option>
              {RUBROS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="register-fields">
            <input
              placeholder="Correo electrónico"
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        )}

        {error && <p className="register-error">{error}</p>}

        <button
          className="register-btn"
          onClick={tab === 'register' ? handleRegister : handleLogin}
          disabled={loading}
        >
          {loading ? 'Cargando...' : tab === 'register' ? 'Comenzar' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
}