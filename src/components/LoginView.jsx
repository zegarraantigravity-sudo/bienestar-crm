import React, { useState } from 'react';
import { Lock, Mail, Columns, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginView({ isModal = false, onClose = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      console.error('Error logging in:', error);
      if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        setErrorMessage('Tu correo requiere confirmación en Supabase. Pídele al administrador o confirma tu correo para ingresar.');
      } else {
        setErrorMessage('Credenciales inválidas. Revisa tu correo o contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = isModal ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    backgroundColor: 'rgba(5, 8, 16, 0.82)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  } : {
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
  };

  return (
    <div style={containerStyle} onClick={isModal ? (e) => { if (e.target === e.currentTarget && onClose) onClose(); } : undefined}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border-color))',
        borderRadius: '20px',
        padding: '36px 30px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px hsla(215, 90%, 55%, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        animation: 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {isModal && onClose && (
          <button
            onClick={onClose}
            type="button"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'hsla(0, 0%, 100%, 0.07)',
              border: '1px solid hsl(var(--border-color))',
              color: 'hsl(var(--text-secondary))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'var(--transition)'
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '40px', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
