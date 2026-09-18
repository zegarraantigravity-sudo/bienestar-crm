import React, { useState } from 'react';
import {
  Columns,
  MessageSquare,
  Mic,
  Zap,
  ShieldCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Send,
  PhoneCall,
  Sparkles,
  ChevronDown,
  Lock,
  Play,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoginView from './LoginView';

export default function LandingPageView() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    phone: '',
    business: '',
    teamSize: '1-3'
  });
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');

  const faqs = [
    {
      q: '¿Cómo funciona el Copiloto de Telegram por voz?',
      a: 'Solo abres Telegram y le envías una nota de voz como si hablaras con tu asistente. Dices: "Anota llamada con Carlos de FitClub para mañana a las 3pm, le gustó el plan anual de S/ 1,200". La Inteligencia Artificial analiza tu voz, busca a Carlos en el CRM, actualiza la etapa a Cita Agendada y programa una alerta 20 minutos antes para que no lo olvides.'
    },
    {
      q: '¿Tengo que instalar aplicaciones pesadas o configurar servidores?',
      a: 'Cero instalaciones. Bienestar CRM es 100% web en la nube, optimizado tanto para computadoras como para celulares. Tu equipo comercial solo necesita su navegador y su Telegram habitual.'
    },
    {
      q: '¿Puedo tener varios vendedores y ocultar prospectos entre ellos?',
      a: 'Sí. El Plan Pro Equipo cuenta con control de roles: cada vendedor ve únicamente los prospectos que tiene asignados, mientras que el administrador o dueño del negocio tiene la vista completa de todos los asesores y puede reasignar leads en un clic.'
    },
    {
      q: '¿Qué pasa si un prospecto me escribe por WhatsApp?',
      a: 'Bienestar CRM cuenta con plantillas de WhatsApp listas en 1 clic para enviar cotizaciones, confirmaciones de citas y seguimientos sin tener que escribir todo desde cero.'
    },
    {
      q: '¿Puedo importar mi lista de clientes actual desde Excel o Google Sheets?',
      a: 'Totalmente. Durante tu sesión de bienvenida te ayudamos a importar tu base de datos actual para que empieces a vender desde el primer día.'
    }
  ];

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!demoForm.name.trim() || !demoForm.phone.trim()) {
      alert('Por favor completa al menos tu nombre y WhatsApp.');
      return;
    }

    setSubmittingDemo(true);

    try {
      // Registrar lead en Supabase
      await supabase.from('leads').insert([
        {
          name: demoForm.name.trim(),
          phone: demoForm.phone.trim(),
          client_type: demoForm.business ? 'gimnasio' : 'otro',
          status: 'prospecto',
          assigned_to: 'Alberto Zegarra',
          notes: `[SOLICITUD DEMO LANDING SAAS]\nNegocio: ${demoForm.business || 'No especificado'}\nEquipo de ventas: ${demoForm.teamSize} asesores`,
          last_interaction: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.warn('Registro directo opcional en BD:', err);
    }

    setSubmittingDemo(false);
    setDemoSubmitted(true);

    // Abrir WhatsApp con Alberto preconfigurado
    const cleanPhone = demoForm.phone.replace(/[^0-9+]/g, '');
    const msg = encodeURIComponent(
      `¡Hola Alberto! 👋 Quiero agendar una demostración de Bienestar CRM.\n\n` +
      `👤 Mi nombre: ${demoForm.name}\n` +
      `📱 WhatsApp: ${cleanPhone}\n` +
      `🏢 Negocio / Empresa: ${demoForm.business || 'Gimnasio / Asesoría'}\n` +
      `👥 Equipo de ventas: ${demoForm.teamSize} asesores\n\n` +
      `¿En qué horario podemos coordinar la demo por Zoom o llamada?`
    );

    setTimeout(() => {
      window.open(`https://wa.me/51922447982?text=${msg}`, '_blank');
    }, 400);
  };

  return (
    <div className="landing-page-root" style={{
      minHeight: '100vh',
      backgroundColor: 'hsl(var(--bg-main))',
      color: 'hsl(var(--text-primary))',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden'
    }}>
      {/* BACKGROUND GLOWS */}
      <div style={{
        position: 'fixed',
        top: '-15%',
        left: '20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, hsla(215, 90%, 55%, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        top: '40%',
        right: '-10%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, hsla(270, 85%, 65%, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* NAVBAR STICKY */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: 'hsla(220, 25%, 6%, 0.85)',
        borderBottom: '1px solid hsla(220, 15%, 16%, 0.8)',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, hsl(215, 90%, 60%), hsl(270, 85%, 65%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px hsla(215, 90%, 60%, 0.35)'
            }}>
              <Columns size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Bienestar CRM
              </div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 600, letterSpacing: '0.04em' }}>
                AI COPILOT + PIPELINE
              </div>
            </div>
          </div>

          {/* NAV LINKS (DESKTOP) */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#copiloto" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'var(--transition)' }}>
              Copiloto Telegram
            </a>
            <a href="#caracteristicas" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'var(--transition)' }}>
              Pipeline Kanban
            </a>
            <a href="#comparativa" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'var(--transition)' }}>
              Comparativa
            </a>
            <a href="#precios" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'var(--transition)' }}>
              Planes
            </a>
            <a href="#faq" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'var(--transition)' }}>
              Preguntas
            </a>
          </nav>

          {/* ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'hsla(220, 20%, 14%, 0.8)',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-primary))',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition)'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'hsl(var(--border-focus))'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'hsl(var(--border-color))'}
            >
              <Lock size={15} color="hsl(var(--color-llamado))" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px hsla(215, 90%, 55%, 0.35)',
                transition: 'var(--transition)'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Sparkles size={16} />
              <span>Solicitar Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '70px 24px 60px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* PILL BADGE */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: 'hsla(215, 90%, 55%, 0.12)',
          border: '1px solid hsla(215, 90%, 55%, 0.3)',
          padding: '7px 18px',
          borderRadius: '50px',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: 'hsl(var(--color-llamado))',
          marginBottom: '26px',
          letterSpacing: '0.03em'
        }}>
          <Sparkles size={14} />
          <span>EL ÚNICO CRM CON COPILOTO DE VOZ EN TELEGRAM</span>
          <span style={{
            background: 'hsl(var(--color-llamado))',
            color: '#000',
            fontSize: '0.68rem',
            padding: '2px 7px',
            borderRadius: '10px',
            fontWeight: 800
          }}>NUEVO</span>
        </div>

        {/* HEADLINE */}
        <h1 style={{
          fontSize: 'clamp(2.3rem, 5.5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          maxWidth: '960px',
          marginBottom: '22px'
        }}>
          Vende más. Cierra más rápido. <br />
          <span style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 60%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Actualiza tu CRM hablándole a Telegram.
          </span>
        </h1>

        {/* SUBTITLE */}
        <p style={{
          fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
          color: 'hsl(var(--text-secondary))',
          maxWidth: '780px',
          lineHeight: 1.6,
          marginBottom: '38px'
        }}>
          Diseñado para <strong>gimnasios, coaches deportivos y equipos comerciales</strong> que no tienen tiempo de sentarse frente a una computadora a llenar 20 campos tras cada llamada.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '50px'
        }}>
          <button
            onClick={() => setShowDemoModal(true)}
            style={{
              background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
              border: 'none',
              color: '#fff',
              padding: '16px 36px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px hsla(215, 90%, 55%, 0.4)',
              transition: 'var(--transition)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>Agendar Demostración Gratis</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-color))',
              color: 'hsl(var(--text-primary))',
              padding: '16px 30px',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'var(--transition)'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'hsl(var(--color-llamado))'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'hsl(var(--border-color))'}
          >
            <Lock size={17} color="hsl(var(--color-llamado))" />
            <span>Acceso Asesores (Login)</span>
          </button>
        </div>

        {/* SOCIAL PROOF CHIPS */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '24px',
          fontSize: '0.86rem',
          color: 'hsl(var(--text-muted))',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="hsl(var(--color-ganado))" />
            <span>Transcribe notas de voz en 2 segundos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="hsl(var(--color-ganado))" />
            <span>Alertas automáticas antes de tus citas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="hsl(var(--color-ganado))" />
            <span>100% en la nube y seguro con Supabase</span>
          </div>
        </div>

        {/* INTERACTIVE DUAL SHOWCASE (KANBAN + TELEGRAM MOCKUP) */}
        <div style={{
          marginTop: '65px',
          width: '100%',
          maxWidth: '1180px',
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.7), 0 0 40px hsla(215, 90%, 55%, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          position: 'relative'
        }}>
          {/* LEFT: PIPELINE KANBAN PREVIEW */}
          <div style={{
            backgroundColor: 'hsl(var(--bg-main))',
            borderRadius: '18px',
            border: '1px solid hsl(var(--border-color))',
            padding: '20px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Tablero Kanban en Tiempo Real</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'hsl(var(--color-llamado))', fontWeight: 600, background: 'hsla(195, 90%, 55%, 0.1)', padding: '3px 9px', borderRadius: '6px' }}>
                Sincronizado
              </span>
            </div>

            {/* KANBAN MINI COLUMNS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Col 1 */}
              <div style={{ background: 'hsla(220, 20%, 12%, 0.6)', borderRadius: '12px', padding: '12px', border: '1px solid hsla(220, 15%, 20%, 0.5)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-llamado))', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>LLAMADO (2)</span>
                  <span>S/ 2,400</span>
                </div>
                <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '8px', padding: '10px', border: '1px solid hsl(var(--border-color))', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Gimnasio Iron Body</div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>Dueño: Kevin Dextre</div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--client-gimnasio))', background: 'hsla(45, 100%, 50%, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>Gimnasio</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>S/ 1,500</span>
                  </div>
                </div>
                <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '8px', padding: '10px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Dra. Patricia Wong</div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>Nutrición Deportiva</div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'hsla(160, 80%, 40%, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>Nutri</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>S/ 900</span>
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div style={{ background: 'hsla(220, 20%, 12%, 0.6)', borderRadius: '12px', padding: '12px', border: '1px solid hsla(270, 85%, 65%, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--color-cita))', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>CITA AGENDADA (2)</span>
                  <span>S/ 4,800</span>
                </div>
                {/* Highlighted updated card */}
                <div style={{
                  background: 'hsla(270, 85%, 65%, 0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid hsl(var(--color-cita))',
                  marginBottom: '8px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '-7px', right: '8px', background: 'hsl(var(--color-cita))', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: '8px' }}>
                    ¡ACTUALIZADO POR VOZ!
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Titan Gym - Rodrigo</div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-secondary))' }}>📅 Viernes 11:00 AM (Zoom)</div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-ganado))', fontWeight: 700 }}>Asesor: Luis Hakim</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c084fc' }}>S/ 1,800</span>
                  </div>
                </div>
                <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '8px', padding: '10px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>SmartFit Miraflores</div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>Cierre convenio corpo</div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'hsla(45, 100%, 50%, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>Cadena</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>S/ 3,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(220, 20%, 8%, 0.6)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
              <span>Pipeline Activo: <strong style={{ color: '#fff' }}>S/ 18,450</strong></span>
              <span>Tasa de Cierre: <strong style={{ color: '#22c55e' }}>34.2%</strong></span>
            </div>
          </div>

          {/* RIGHT: SMARTPHONE TELEGRAM COPILOT PREVIEW */}
          <div style={{
            backgroundColor: '#17212b',
            borderRadius: '18px',
            border: '2px solid hsla(215, 90%, 60%, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Telegram Header */}
            <div style={{
              background: '#242f3d',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderBottom: '1px solid #10161e'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2AABEE, #229ED9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>Copiloto Bienestar CRM</div>
                <div style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                  bot con Inteligencia Artificial
                </div>
              </div>
            </div>

            {/* Telegram Chat Body */}
            <div style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flex: 1,
              background: '#0e1621'
            }}>
              {/* User Voice Note Bubble */}
              <div style={{
                alignSelf: 'flex-end',
                maxWidth: '88%',
                background: '#2b5278',
                color: '#fff',
                borderRadius: '16px 16px 4px 16px',
                padding: '12px 14px',
                fontSize: '0.84rem',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#5b88bd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Play size={14} fill="#fff" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>🎙️ Nota de voz (0:09)</span>
                    <span style={{ fontSize: '0.7rem', color: '#a5c4e8' }}>Transcrito por IA:</span>
                  </div>
                </div>
                <div style={{ fontStyle: 'italic', color: '#e2edfa', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  “Anota llamada con Rodrigo de Titan Gym. Cerramos cita por Zoom este viernes a las 11:00 am. Monto S/ 1,800.”
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.66rem', color: '#88a8cc', marginTop: '4px' }}>14:22 ✓✓</div>
              </div>

              {/* Bot Answer Bubble */}
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '90%',
                background: '#182533',
                color: '#e4ecf2',
                borderRadius: '16px 16px 16px 4px',
                padding: '14px 16px',
                fontSize: '0.84rem',
                border: '1px solid #233446',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontWeight: 700, color: '#4ade80', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡ ¡Lead Registrado & Actualizado!</span>
                </div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#c9d9e6' }}>
                  <div>🏢 <strong>Contacto:</strong> Rodrigo (Titan Gym)</div>
                  <div>📊 <strong>Etapa:</strong> 📅 Cita Agendada</div>
                  <div>⏰ <strong>Fecha:</strong> Viernes 11:00 AM</div>
                  <div>💰 <strong>Monto estimado:</strong> S/ 1,800</div>
                  <div>👤 <strong>Asignado a:</strong> Luis Hakim</div>
                </div>
                <div style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid #233446',
                  fontSize: '0.75rem',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={13} />
                  <span>Te enviaré un recordatorio 20 min antes.</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.66rem', color: '#68829e', marginTop: '4px' }}>14:22</div>
              </div>
            </div>

            {/* Telegram Input Bar */}
            <div style={{
              background: '#17212b',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #233446'
            }}>
              <span style={{ color: '#6e869f', fontSize: '0.82rem' }}>Escribe un mensaje o mantén presionado...</span>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#2AABEE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Mic size={18} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: VOICE-TO-CRM KILLER FEATURE */}
      <section id="copiloto" style={{
        padding: '90px 24px',
        maxWidth: '1240px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'hsl(var(--color-cita))',
          fontWeight: 700,
          fontSize: '0.85rem',
          letterSpacing: '0.06em',
          marginBottom: '14px'
        }}>
          <Zap size={16} />
          <span>EL ARMA SECRETA DE TU EQUIPO</span>
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
          Por qué tus vendedores amarán este CRM
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto 60px' }}>
          El mayor problema de Pipedrive o Bitrix24 es que los vendedores odian llenarlo porque pierden tiempo valioso. Con Bienestar CRM, dictan desde la calle en 5 segundos.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '20px',
            padding: '34px 26px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'var(--transition)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'hsla(195, 90%, 55%, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--color-llamado))'
            }}>
              <Mic size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>1. Dictas por audio tras colgar</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Saliste de una reunión o colgaste una llamada mientras manejas. Envías un audio a Telegram resumiendo lo acordado sin detener tu día.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '20px',
            padding: '34px 26px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'var(--transition)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'hsla(270, 85%, 65%, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--color-cita))'
            }}>
              <Sparkles size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>2. La IA estructura la bitácora</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.92rem', lineHeight: 1.6 }}>
              El Copiloto extrae los datos clave: nombre del contacto, monto del plan, fecha y hora de la cita, actualizando automáticamente el Kanban.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '20px',
            padding: '34px 26px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'var(--transition)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'hsla(145, 75%, 45%, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--color-ganado))'
            }}>
              <Clock size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>3. Alertas antes de cada reunión</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Recibe avisos inteligentes 1 hora antes de llamadas y 20 minutos antes de citas con el resumen de lo hablado previamente. Cero tratos olvidados.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: COMPARISON TABLE (BIENESTAR VS PIPEDRIVE VS BITRIX24) */}
      <section id="comparativa" style={{
        padding: '90px 24px',
        backgroundColor: 'hsla(220, 25%, 4%, 0.7)',
        borderTop: '1px solid hsl(var(--border-color))',
        borderBottom: '1px solid hsl(var(--border-color))'
      }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, marginBottom: '14px' }}>
            Comparativa directa
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1rem', maxWidth: '650px', margin: '0 auto 48px' }}>
            Descubre por qué las soluciones tradicionales son demasiado lentas para equipos comerciales ágiles.
          </p>

          <div style={{
            overflowX: 'auto',
            borderRadius: '20px',
            border: '1px solid hsl(var(--border-color))',
            backgroundColor: 'hsl(var(--bg-card))'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', background: 'hsla(220, 20%, 8%, 0.8)' }}>
                  <th style={{ padding: '18px 24px', fontWeight: 700, color: 'hsl(var(--text-muted))', width: '40%' }}>CARACTERÍSTICA</th>
                  <th style={{ padding: '18px 20px', fontWeight: 800, color: '#60a5fa', width: '25%', background: 'hsla(215, 90%, 55%, 0.1)' }}>
                    ✨ Bienestar CRM
                  </th>
                  <th style={{ padding: '18px 20px', fontWeight: 600, color: 'hsl(var(--text-secondary))', width: '17%' }}>Pipedrive</th>
                  <th style={{ padding: '18px 20px', fontWeight: 600, color: 'hsl(var(--text-secondary))', width: '18%' }}>Bitrix24</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>Copiloto por notas de voz en Telegram</td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 700, background: 'hsla(215, 90%, 55%, 0.05)' }}>✅ Incluido de fábrica</td>
                  <td style={{ padding: '16px 20px', color: '#f87171' }}>❌ No disponible</td>
                  <td style={{ padding: '16px 20px', color: '#f87171' }}>❌ No disponible</td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>Tiempo para registrar una llamada / acuerdo</td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 700, background: 'hsla(215, 90%, 55%, 0.05)' }}>⚡ 5 segundos (audio)</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ 2-4 minutos (manual)</td>
                  <td style={{ padding: '16px 20px', color: '#f87171' }}>❌ 5+ minutos (muy lento)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>Curva de aprendizaje para los vendedores</td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 700, background: 'hsla(215, 90%, 55%, 0.05)' }}>✅ 10 minutos (intuitivo)</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Días de capacitación</td>
                  <td style={{ padding: '16px 20px', color: '#f87171' }}>❌ Semanas (complejo)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>Plantillas directas de WhatsApp en 1 toque</td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 700, background: 'hsla(215, 90%, 55%, 0.05)' }}>✅ Integradas en Kanban</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Requiere plugins de pago</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Configuración engorrosa</td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>Alertas de llamadas directo a tu mensajería</td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 700, background: 'hsla(215, 90%, 55%, 0.05)' }}>✅ Telegram proactivo</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Solo email o push</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Notificaciones perdidas</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>Precios en moneda local y soporte directo</td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 700, background: 'hsla(215, 90%, 55%, 0.05)' }}>✅ Soporte en WhatsApp</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Soporte en inglés/tickets</td>
                  <td style={{ padding: '16px 20px', color: '#fbbf24' }}>⚠️ Tickets demorados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION: CORE FEATURES GRID */}
      <section id="caracteristicas" style={{
        padding: '90px 24px',
        maxWidth: '1240px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'hsl(var(--color-llamado))',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            marginBottom: '14px'
          }}>
            <Layers size={16} />
            <span>SISTEMA COMERCIAL INTEGRADO</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Todo lo que necesitas para cerrar más ventas
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
            Diseñado para que ningún prospecto se quede sin seguimiento y cada miembro de tu equipo rinda al máximo.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Feature 1 */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '18px', padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(215, 90%, 55%, 0.12)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Columns size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Embudo Kanban Visual</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Arrastra tratos entre etapas: Prospecto ➔ Llamado ➔ Cita Agendada ➔ Cierre Ganado. Visualiza el valor total de cada etapa al instante.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '18px', padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(270, 85%, 65%, 0.12)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Multi-Asesor con Roles</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Permite a tus vendedores ver únicamente su propia cartera, mientras la gerencia supervisa todos los números y reasigna prospectos en un clic.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '18px', padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(145, 75%, 45%, 0.12)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Plantillas Directas de WhatsApp</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Genera mensajes persuasivos predeterminados para confirmar reuniones, enviar datos de pago o hacer seguimiento con 1 solo toque.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '18px', padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(35, 100%, 55%, 0.12)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Semáforo de Seguimiento Vencido</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Detección visual de leads fríos o llamadas atrasadas. Tu equipo sabe exactamente a quién llamar primero para no dejar escapar ventas.
            </p>
          </div>

          {/* Feature 5 */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '18px', padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(0, 75%, 55%, 0.12)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Auditoría de Motivos de Pérdida</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Registra si una venta se cayó por precio, tiempo, competencia o desinterés. Información de oro para entrenar a tus asesores y mejorar tus ofertas.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '18px', padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(215, 90%, 55%, 0.12)', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Seguridad Supabase Enterprise</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Tu base de datos comercial protegida con encriptación de nivel bancario, respaldos continuos y control de sesiones por usuario.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: PRICING PLANS */}
      <section id="precios" style={{
        padding: '90px 24px',
        backgroundColor: 'hsla(220, 25%, 4%, 0.7)',
        borderTop: '1px solid hsl(var(--border-color))',
        borderBottom: '1px solid hsl(var(--border-color))'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'hsl(var(--color-ganado))',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            marginBottom: '14px'
          }}>
            <DollarSign size={16} />
            <span>INVERSIÓN SIMPLE Y TRANSPARENTE</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Planes adaptados a tu etapa comercial
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 60px' }}>
            Empieza hoy y recupera tu inversión con tan solo 1 o 2 ventas cerradas al mes.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            textAlign: 'left'
          }}>
            {/* PLAN COACH / SOLO */}
            <div style={{
              backgroundColor: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: '24px',
              padding: '36px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>Plan Coach / Solo</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.86rem', marginBottom: '22px' }}>
                  Para entrenadores, consultores y asesores independientes.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '26px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>S/ 149</span>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>/ mes</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span><strong>1 Asesor</strong> comercial</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span><strong>Copiloto de Telegram</strong> por voz</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Tablero Kanban sin límite de prospectos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Plantillas directas de WhatsApp</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Bitácora y cronología de cada cliente</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDemoModal(true)}
                style={{
                  width: '100%',
                  background: 'hsla(220, 20%, 16%, 0.9)',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-primary))',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'hsl(var(--color-llamado))'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'hsl(var(--border-color))'}
              >
                Comenzar con Plan Solo
              </button>
            </div>

            {/* PLAN PRO EQUIPO (DESTACADO) */}
            <div style={{
              backgroundColor: 'hsl(var(--bg-card))',
              border: '2px solid hsl(var(--color-cita))',
              borderRadius: '24px',
              padding: '36px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 16px 50px hsla(270, 85%, 65%, 0.18)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-13px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 65%))',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: '20px',
                letterSpacing: '0.04em'
              }}>
                🔥 MÁS POPULAR PARA GIMNASIOS
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>Pro Equipo</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.86rem', marginBottom: '22px' }}>
                  Ideal para gimnasios, centros fitness y fuerzas de ventas.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '26px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>S/ 349</span>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>/ mes</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#c084fc" />
                    <span><strong>Hasta 5 Asesores</strong> comerciales</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#c084fc" />
                    <span><strong>Reasignación de leads</strong> entre asesores en 1 clic</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#c084fc" />
                    <span><strong>Copiloto de Telegram multi-usuario</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#c084fc" />
                    <span>Alertas automáticas de citas y reuniones</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#c084fc" />
                    <span>Control de permisos y vista privada por vendedor</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#c084fc" />
                    <span><strong>Soporte prioritario</strong> directo por WhatsApp</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDemoModal(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 65%))',
                  border: 'none',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px hsla(270, 85%, 65%, 0.35)',
                  transition: 'var(--transition)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Solicitar Demostración Pro
              </button>
            </div>

            {/* PLAN CORPORATIVO */}
            <div style={{
              backgroundColor: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: '24px',
              padding: '36px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>Corporativo</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.86rem', marginBottom: '22px' }}>
                  Para cadenas de gimnasios, franquicias y múltiples sedes.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '26px' }}>
                  <span style={{ fontSize: '2.1rem', fontWeight: 800 }}>A Medida</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span><strong>Asesores y sedes ilimitadas</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Embudos comerciales personalizados</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Integraciones vía Webhook y API</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Capacitación en vivo para todo tu equipo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={17} color="#22c55e" />
                    <span>Gestor de cuenta exclusivo</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDemoModal(true)}
                style={{
                  width: '100%',
                  background: 'hsla(220, 20%, 16%, 0.9)',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-primary))',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'hsl(var(--color-llamado))'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'hsl(var(--border-color))'}
              >
                Consultar Plan Corporativo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: FAQ */}
      <section id="faq" style={{
        padding: '90px 24px',
        maxWidth: '860px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'hsl(var(--color-cita))',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            marginBottom: '14px'
          }}>
            <HelpCircle size={16} />
            <span>RESPUESTAS CLARAS</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.5rem)', fontWeight: 800, marginBottom: '14px' }}>
            Preguntas Frecuentes
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1rem' }}>
            Todo lo que necesitas saber antes de empezar con Bienestar CRM.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'var(--transition)'
              }}
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-primary))',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.02rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  color="hsl(var(--text-muted))"
                  style={{
                    transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.25s ease'
                  }}
                />
              </button>
              {activeFaq === idx && (
                <div style={{
                  padding: '0 24px 22px',
                  color: 'hsl(var(--text-secondary))',
                  fontSize: '0.93rem',
                  lineHeight: 1.65,
                  borderTop: '1px solid hsla(220, 15%, 16%, 0.4)',
                  paddingTop: '16px'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA STRIP */}
      <section style={{
        padding: '70px 24px',
        maxWidth: '1240px',
        margin: '0 auto 60px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, hsla(215, 90%, 55%, 0.15) 0%, hsla(270, 85%, 65%, 0.15) 100%)',
          border: '1px solid hsla(215, 90%, 60%, 0.3)',
          borderRadius: '28px',
          padding: '60px 30px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', fontWeight: 800, marginBottom: '16px' }}>
            ¿Listo para revolucionar las ventas de tu negocio?
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.08rem', maxWidth: '640px', marginBottom: '36px' }}>
            Agenda una demostración de 15 minutos personalizada con nuestro fundador Alberto Zegarra y comprueba el impacto en tus números.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
                border: 'none',
                color: '#fff',
                padding: '16px 36px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 25px hsla(215, 90%, 55%, 0.4)'
              }}
            >
              <span>Solicitar Demo por WhatsApp</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-primary))',
                padding: '16px 28px',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Acceso a la Plataforma
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid hsl(var(--border-color))',
        backgroundColor: 'hsl(var(--bg-sidebar))',
        padding: '40px 24px',
        color: 'hsl(var(--text-muted))',
        fontSize: '0.86rem'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, hsl(215, 90%, 60%), hsl(270, 85%, 65%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Columns size={16} />
            </div>
            <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Bienestar CRM</span>
            <span>© {new Date().getFullYear()} — Todos los derechos reservados.</span>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setShowLoginModal(true)}>Acceso Asesores</span>
            <a href="https://wa.me/51922447982" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              WhatsApp: +51 922 447 982
            </a>
          </div>
        </div>
      </footer>

      {/* DEMO REQUEST MODAL */}
      {showDemoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowDemoModal(false); }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '24px',
            padding: '36px 30px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px hsla(215, 90%, 55%, 0.15)',
            animation: 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <button
              onClick={() => setShowDemoModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'hsla(0, 0%, 100%, 0.08)',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-secondary))',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              ✕
            </button>

            {demoSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'hsla(145, 75%, 45%, 0.15)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px' }}>¡Solicitud enviada!</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
                  Te estamos redirigiendo a WhatsApp con Alberto Zegarra para confirmar tu horario de demo.
                </p>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  Entendido
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'inline-block', color: 'hsl(var(--color-llamado))', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '6px' }}>
                    DEMOSTRACIÓN PERSONALIZADA
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Agenda tu demo comercial</h3>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', marginTop: '4px' }}>
                    Te mostraremos en vivo cómo opera el Copiloto de Telegram en tu negocio.
                  </p>
                </div>

                <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Tu Nombre Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Rodrigo Morales"
                      value={demoForm.name}
                      onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>WhatsApp / Teléfono *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+51 987 654 321"
                      value={demoForm.phone}
                      onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre de tu Gimnasio o Negocio</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Iron Gym Miraflores / Asesoría Fitness"
                      value={demoForm.business}
                      onChange={e => setDemoForm({ ...demoForm, business: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>¿Cuántos vendedores o entrenadores tienen?</label>
                    <select
                      className="form-control"
                      value={demoForm.teamSize}
                      onChange={e => setDemoForm({ ...demoForm, teamSize: e.target.value })}
                    >
                      <option value="Solo yo (1 asesor)">Solo yo (1 asesor)</option>
                      <option value="2 a 4 asesores">2 a 4 asesores</option>
                      <option value="5 a 10 asesores">5 a 10 asesores</option>
                      <option value="Más de 10 asesores">Más de 10 asesores</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingDemo}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      marginTop: '8px',
                      background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
                      boxShadow: '0 4px 18px hsla(215, 90%, 55%, 0.35)'
                    }}
                  >
                    {submittingDemo ? 'Procesando...' : 'Coordinar Demo por WhatsApp ➔'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGIN MODAL (SEAMLESS FOR ALBERTO & LUIS) */}
      {showLoginModal && (
        <LoginView isModal={true} onClose={() => setShowLoginModal(false)} />
      )}

      {/* STYLES & MEDIA QUERIES */}
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
        @media (max-width: 820px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
