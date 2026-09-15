import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, CheckCircle2, Clock, Calendar, RefreshCw, MessageSquare, ChevronDown } from 'lucide-react';
import { askAICopilot } from '../lib/aiService';
import { supabase } from '../lib/supabaseClient';
import { getUserDisplayName } from '../lib/utils';

export default function AIChatWidget({ leads, onUpdateLead, userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `¡Hola ${getUserDisplayName(userEmail)}! Soy tu copiloto de ventas de Bienestar CRM. 🤖✨\n\nPuedes pedirme resúmenes, decirme qué hablaste con un cliente para anotarlo en su bitácora, o programar llamadas en lenguaje natural.\n\nPor ejemplo: "Hablé con Noé y me dijo que lo llame el sábado a las 10 am"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionBadge: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (userText = input) => {
    const textToSend = typeof userText === 'string' ? userText.trim() : input.trim();
    if (!textToSend || loading) return;

    setInput('');
    const userMsgObj = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const displayName = getUserDisplayName(userEmail);
      const aiResponse = await askAICopilot({
        userMessage: textToSend,
        leads,
        userEmail,
        userDisplayName: displayName
      });

      let actionBadge = null;

      // Handle intent: update_lead
      if (aiResponse.intent === 'update_lead' && (aiResponse.target_lead_id || aiResponse.target_lead_name)) {
        const targetLead = leads.find(l => {
          if (aiResponse.target_lead_id && l.id === aiResponse.target_lead_id) return true;
          const searchName = (aiResponse.target_lead_name || '').toLowerCase().trim();
          const contact = (l.contact_name || '').toLowerCase();
          const business = (l.business_name || '').toLowerCase();
          return contact.includes(searchName) || business.includes(searchName) || searchName.includes(contact);
        });

        if (targetLead) {
          // Parse existing lead notes
          let timeline = [];
          let currentNextAction = '';
          let currentNextDate = '';
          let currentLostReason = '';
          let currentLostLabel = '';

          try {
            const parsed = JSON.parse(targetLead.notes || '[]');
            if (Array.isArray(parsed)) {
              timeline = parsed;
            } else if (parsed && typeof parsed === 'object') {
              timeline = parsed.timeline || [];
              currentNextAction = parsed.next_action || '';
              currentNextDate = parsed.next_action_date || '';
              currentLostReason = parsed.lost_reason || '';
              currentLostLabel = parsed.lost_reason_label || '';
            } else if (targetLead.notes) {
              timeline = [{ date: targetLead.created_at || new Date().toISOString(), text: targetLead.notes }];
            }
          } catch (e) {
            if (targetLead.notes) {
              timeline = [{ date: targetLead.created_at || new Date().toISOString(), text: targetLead.notes }];
            }
          }

          // Add note to timeline if provided
          if (aiResponse.note_text) {
            timeline = [
              {
                date: new Date().toISOString(),
                text: aiResponse.note_text
              },
              ...timeline
            ];
          }

          // Update next action
          const finalNextAction = aiResponse.next_action_text || currentNextAction;
          const finalNextDate = aiResponse.next_action_date || currentNextDate;

          const updatedNotesPayload = JSON.stringify({
            timeline,
            next_action: finalNextAction,
            next_action_date: finalNextDate,
            lost_reason: currentLostReason,
            lost_reason_label: currentLostLabel
          });

          const leadUpdateFields = {
            notes: updatedNotesPayload,
            last_interaction: new Date().toISOString()
          };

          if (aiResponse.new_status) {
            leadUpdateFields.status = aiResponse.new_status;
          }
          if (aiResponse.new_plan) {
            leadUpdateFields.target_plan = aiResponse.new_plan;
          }
          if (aiResponse.new_value) {
            leadUpdateFields.estimated_value = parseFloat(aiResponse.new_value) || targetLead.estimated_value;
          }

          // Execute Supabase update
          const { data, error } = await supabase
            .from('leads')
            .update(leadUpdateFields)
            .eq('id', targetLead.id)
            .select();

          if (error) throw error;

          if (data && data[0]) {
            onUpdateLead(data[0]);
            actionBadge = `✅ Lead "${targetLead.contact_name || targetLead.business_name}" actualizado en Supabase`;
          }
        }
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: aiResponse.reply_message || 'Entendido. Procesé tu solicitud.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge
        }
      ]);

    } catch (error) {
      console.error('Error with AI assistant:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Lo siento, hubo un detalle al procesar la respuesta: ${error.message}. Por favor intenta nuevamente.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '¿Qué tareas o llamadas tengo para hoy?',
    'Hazme un resumen de Noé Rojas',
    '¿Qué prospectos llevan más de 5 días estancados?'
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'inherit' }}>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.45)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'pulseGlow 3s infinite'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '28px',
            height: '28px'
          }}>
            <Bot size={18} />
          </div>
          <span>Copiloto IA</span>
          <Sparkles size={16} style={{ color: '#FDE047' }} />
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div style={{
          width: '390px',
          height: '540px',
          maxHeight: 'calc(100vh - 100px)',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '20px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(to right, hsla(215, 90%, 55%, 0.12), hsla(270, 85%, 60%, 0.12))',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Copiloto IA</h3>
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: 700
                  }}>
                    Qwen Plus
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Conectado a tu CRM en vivo
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--text-muted))',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Minimizar Asistente"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: m.role === 'user' ? 'hsl(var(--color-presentacion))' : 'hsl(var(--bg-sidebar))',
                  color: m.role === 'user' ? '#000' : 'hsl(var(--text-primary))',
                  fontWeight: m.role === 'user' ? 600 : 400,
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  border: m.role === 'user' ? 'none' : '1px solid hsl(var(--border-color))',
                  whiteSpace: 'pre-line',
                  boxShadow: m.role === 'user' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none'
                }}>
                  {m.text}
                </div>

                {m.actionBadge && (
                  <div style={{
                    fontSize: '0.72rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={12} />
                    <span>{m.actionBadge}</span>
                  </div>
                )}

                <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', padding: '0 4px' }}>
                  {m.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                <RefreshCw size={14} className="spin-animation" />
                <span>El Asistente está pensando y consultando el CRM...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div style={{
            padding: '6px 12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            borderTop: '1px solid hsl(var(--border-color))',
            backgroundColor: 'hsla(0, 0%, 0%, 0.15)'
          }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(p)}
                disabled={loading}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'hsl(var(--bg-sidebar))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid hsl(var(--border-color))',
              display: 'flex',
              gap: '8px',
              backgroundColor: 'hsl(var(--bg-card))'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe una instrucción o pregunta..."
              className="form-control"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '8px 12px',
                borderRadius: '10px'
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Enviar instrucción"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 8px 30px rgba(168, 85, 247, 0.6); }
          100% { box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4); }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
