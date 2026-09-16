import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, CheckCircle2, RefreshCw, Mic, MicOff, Maximize2, Minimize2, Copy, Check, RotateCcw } from 'lucide-react';
import { askAICopilot, robustParseAIResponse } from '../lib/aiService';
import { supabase } from '../lib/supabaseClient';
import { getUserDisplayName } from '../lib/utils';

export default function AIChatWidget({ leads, onUpdateLead, userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem('crm_copilot_expanded');
      return stored !== null ? stored === 'true' : true; // Default to wide/comfortable!
    } catch (e) {
      return true;
    }
  });
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `¡Hola ${getUserDisplayName(userEmail)}! Soy tu copiloto de ventas de Bienestar CRM. 🤖✨\n\nPuedes consultarme sobre tus clientes, pedirme consejos comerciales, qué responderles por WhatsApp, o registrar notas y tareas en lenguaje natural.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionBadge: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('crm_copilot_expanded', String(next));
      } catch (e) {}
      return next;
    });
  };

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2200);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleResetConversation = () => {
    if (window.confirm('¿Deseas reiniciar la conversación con el copiloto? Se borrará el historial de esta sesión.')) {
      setMessages([
        {
          role: 'assistant',
          text: `¡Hola ${getUserDisplayName(userEmail)}! Conversación reiniciada. 🤖✨\n\n¿En qué cliente o tarea comercial nos enfocamos ahora?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge: null
        }
      ]);
    }
  };

  // Single dictation logic (Speech to Text)
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz directo. Te recomendamos usar Google Chrome o Microsoft Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-PE';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let transcriptText = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcriptText += event.results[i][0].transcript;
        }
        if (transcriptText) {
          setInput(transcriptText);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    }
  };

  const toggleListening = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const handleSend = async (userText = input) => {
    if (isRecording) {
      stopListening();
    }
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
      const historyForAI = messages
        .slice(-12)
        .map(m => ({
          role: m.role,
          content: m.text
        }));

      const aiResponse = await askAICopilot({
        userMessage: textToSend,
        conversationHistory: historyForAI,
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

          if (aiResponse.note_text) {
            timeline = [
              {
                date: new Date().toISOString(),
                text: aiResponse.note_text
              },
              ...timeline
            ];
          }

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

      let replyText = aiResponse.reply_message || 'Entendido. Procesé tu solicitud.';
      if (typeof replyText === 'string' && replyText.trim().startsWith('{') && replyText.includes('"reply_message"')) {
        const cleaned = robustParseAIResponse(replyText);
        if (cleaned.reply_message) {
          replyText = cleaned.reply_message;
        }
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge
        }
      ]);

    } catch (error) {
      console.error('Error with AI assistant:', error);
      const errReply = `⚠️ Lo siento, hubo un detalle al procesar la respuesta: ${error.message}`;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: errReply,
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
    '¿Qué le puedo escribir a Claudia para su llamada?',
    'Analiza a Noé Rojas y qué le puedo responder',
    '¿Qué prospectos están estancados?'
  ];

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'inherit' }}>
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
            padding: '14px 22px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 26px rgba(59, 130, 246, 0.45)',
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
            width: '30px',
            height: '30px'
          }}>
            <Bot size={20} />
          </div>
          <span>Copiloto IA</span>
          <Sparkles size={16} style={{ color: '#FDE047' }} />
        </button>
      )}

      {/* Floating Widget Container */}
      {isOpen && (
        <div style={{
          width: isExpanded ? 'min(900px, calc(100vw - 32px))' : 'min(540px, calc(100vw - 32px))',
          height: isExpanded ? 'min(860px, calc(100vh - 36px))' : 'min(680px, calc(100vh - 44px))',
          maxHeight: isExpanded ? 'calc(100vh - 32px)' : 'calc(100vh - 44px)',
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '22px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(to right, hsla(215, 90%, 55%, 0.14), hsla(270, 85%, 60%, 0.14))',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, hsl(215, 90%, 55%), hsl(270, 85%, 60%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.35)'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-primary))' }}>Copiloto IA</h3>
                  <span style={{
                    fontSize: '0.68rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700
                  }}>
                    Estratega Comercial
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Conectado con memoria y contexto a tu CRM
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Reset conversation */}
              <button
                type="button"
                onClick={handleResetConversation}
                style={{
                  background: 'hsl(var(--bg-sidebar))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
                title="Reiniciar conversación y limpiar historial"
              >
                <RotateCcw size={14} />
                <span style={{ display: isExpanded ? 'inline' : 'none' }}>Nuevo chat</span>
              </button>

              {/* Maximize / Minimize toggle */}
              <button
                type="button"
                onClick={toggleExpanded}
                style={{
                  background: 'hsl(var(--bg-sidebar))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
                title={isExpanded ? "Reducir ventana" : "Ampliar chat como espacio de trabajo"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                <span style={{ display: isExpanded ? 'inline' : 'none' }}>Reducir</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Minimizar Copiloto"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isExpanded ? '20px 24px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: isExpanded ? '16px' : '12px'
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
                  maxWidth: isExpanded ? '90%' : '88%',
                  padding: isExpanded ? '14px 18px' : '11px 15px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: m.role === 'user' ? 'hsl(var(--color-presentacion))' : 'hsl(var(--bg-sidebar))',
                  color: m.role === 'user' ? '#000' : 'hsl(var(--text-primary))',
                  fontWeight: m.role === 'user' ? 600 : 400,
                  fontSize: isExpanded ? '0.96rem' : '0.88rem',
                  lineHeight: '1.55',
                  border: m.role === 'user' ? 'none' : '1px solid hsl(var(--border-color))',
                  whiteSpace: 'pre-line',
                  boxShadow: m.role === 'user' ? '0 2px 10px rgba(245, 158, 11, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}>
                  {m.text}
                </div>

                {m.actionBadge && (
                  <div style={{
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    marginTop: '2px'
                  }}>
                    <CheckCircle2 size={14} />
                    <span>{m.actionBadge}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px', marginTop: '2px' }}>
                  {m.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(m.text, idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedIdx === idx ? '#22c55e' : 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}
                      title="Copiar texto de la respuesta"
                    >
                      {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedIdx === idx ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                <RefreshCw size={16} className="spin-animation" />
                <span>Analizando historial del cliente y consultando CRM...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '8px',
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
                  fontSize: '0.75rem',
                  padding: '5px 12px',
                  borderRadius: '14px',
                  backgroundColor: 'hsl(var(--bg-sidebar))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(var(--color-presentacion))'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(var(--border-color))'}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: isExpanded ? '14px 18px' : '12px 14px',
              borderTop: '1px solid hsl(var(--border-color))',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              backgroundColor: 'hsl(var(--bg-card))'
            }}
          >
            <textarea
              ref={inputRef}
              rows={isExpanded ? 2 : 1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRecording ? "🎙️ Escuchando... habla ahora..." : "Escribe o dicta tu consulta (Enter para enviar)..."}
              className="form-control"
              style={{
                flex: 1,
                fontSize: isExpanded ? '0.94rem' : '0.88rem',
                padding: '10px 14px',
                borderRadius: '12px',
                resize: 'none',
                border: isRecording ? '1px solid #ef4444' : '1px solid hsl(var(--border-color))',
                backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.08)' : 'hsl(var(--bg-sidebar))',
                color: 'hsl(var(--text-primary))',
                lineHeight: '1.4'
              }}
              disabled={loading}
            />

            {/* Microphone Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={loading}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isRecording ? '#ef4444' : 'hsl(var(--bg-sidebar))',
                color: isRecording ? 'white' : 'hsl(var(--text-secondary))',
                border: isRecording ? '1px solid #dc2626' : '1px solid hsl(var(--border-color))',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                animation: isRecording ? 'pulseRecording 1.2s infinite' : 'none'
              }}
              title={isRecording ? "Detener dictado por voz" : "Dictar por voz (micrófono)"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Enviar mensaje"
            >
              <Send size={18} />
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
        @keyframes pulseRecording {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
