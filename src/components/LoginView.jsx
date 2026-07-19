import React, { useState } from 'react';
import { Lock, Mail, Columns } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error loggin in:', error);
      setErrorMessage('Credenciales inválidas. Revisa tu correo o contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'hsl(var(--bg-main))',
      backgroundImage: `
        radial-gradient(at 0% 0%, hsla(215, 90%, 55%, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, hsla(270, 85%, 60%, 0.06) 0px, transparent 50%)
      `,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border-color))',
        borderRadius: '20px',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Branding header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon" style={{ width: '48px', height: '48px' }}>
            <Columns size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, hsl(var(--text-secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Bienestar CRM
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textAlign: 'center' }}>
            Ingresa tus credenciales para acceder al sistema comercial
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div style={{
              backgroundColor: 'hsla(0, 75%, 55%, 0.1)',
              border: '1px solid hsla(0, 75%, 55%, 0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: 'hsl(var(--color-perdido))',
              fontWeight: 500
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
