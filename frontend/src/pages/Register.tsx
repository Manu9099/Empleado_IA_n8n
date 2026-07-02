import React, { useState } from 'react';
import { register, login } from '../api/client';
import './Register.css';

const RUBROS = [
  'Abogacía', 'Medicina', 'Odontología', 'Psicología',
  'Construcción', 'Joyería', 'Belleza', 'Educación',
  'Contabilidad', 'Otro',
];

interface Props {
  onSuccess: (token: string, name: string, business: string) => void;
}

export default function Register({ onSuccess }: Props) {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', business_name: '', rubro: '',
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.email || !form.business_name || !form.rubro) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await register(form);
      localStorage.clear();
      localStorage.setItem('session_token', res.session_token);
      localStorage.setItem('user_name', form.name);
      localStorage.setItem('business_name', form.business_name);
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
            <input placeholder="Tu nombre" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Teléfono" type="tel" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Correo electrónico" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Nombre del negocio" value={form.business_name}
              onChange={e => setForm({ ...form, business_name: e.target.value })} />
            <select value={form.rubro} onChange={e => setForm({ ...form, rubro: e.target.value })}>
              <option value="">Selecciona tu rubro</option>
              {RUBROS.map(r => <option key={r} value={r}>{r}</option>)}
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
