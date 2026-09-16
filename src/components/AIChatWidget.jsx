import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, CheckCircle2, Clock, Calendar, RefreshCw, MessageSquare, ChevronDown, Mic, MicOff, Volume2, VolumeX, Radio, PhoneCall, PhoneOff } from 'lucide-react';
import { askAICopilot } from '../lib/aiService';
import { supabase } from '../lib/supabaseClient';
import { getUserDisplayName } from '../lib/utils';

export default function AIChatWidget({ leads, onUpdateLead, userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `¡Hola ${getUserDisplayName(userEmail)}! Soy tu copiloto de ventas de Bienestar CRM. 🤖✨\n\nPuedes hablarme en lenguaje natural o activar el Modo Conversación Continua para platicar con voz manos libres como en una llamada.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionBadge: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveVoiceMode, setIsLiveVoiceMode] = useState(false);
  const [liveVoiceState, setLiveVoiceState] = useState('idle'); // 'listening' | 'processing' | 'speaking' | 'idle'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isLiveVoiceRef = useRef(false);

  // Sync ref
  useEffect(() => {
    isLiveVoiceRef.current = isLiveVoiceMode;
  }, [isLiveVoiceMode]);

  // Clean and speak text using browser TTS
  const speakText = (text, onEnd) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/[*_#`~[\]]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/✅|❌|🤖|✨|📌|📅|⏰|❄️|📞|💬|👂|🔊|🎙️/g, '')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-PE';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.includes('es') || v.lang.includes('ES'));
      if (esVoice) {
        utterance.voice = esVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (isLiveVoiceRef.current) {
          setLiveVoiceState('speaking');
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Error in speakText:', err);
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start dictation for single input
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador actual no soporta dictado por voz. Te recomendamos usar Google Chrome o Microsoft Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
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

  // Live Hands-Free Conversational Voice Loop (ChatGPT style)
  const startLiveVoiceMode = () => {
    setIsLiveVoiceMode(true);
    isLiveVoiceRef.current = true;
    setLiveVoiceState('speaking');
    
    speakText("Modo conversación en vivo activado. Te escucho, Alberto.", () => {
      if (isLiveVoiceRef.current) {
        listenForLiveVoiceCommand();
      }
    });
  };

  const exitLiveVoiceMode = () => {
    setIsLiveVoiceMode(false);
    isLiveVoiceRef.current = false;
    stopSpeaking();
    stopListening();
    setLiveVoiceState('idle');
  };

  const listenForLiveVoiceCommand = () => {
    if (!isLiveVoiceRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz continuo.');
      exitLiveVoiceMode();
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

      let finalTranscript = '';

      recognition.onstart = () => {
        setLiveVoiceState('listening');
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const currentSpoken = finalTranscript || interim;
        if (currentSpoken) {
          setInput(currentSpoken);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Live voice recognition error:', event.error);
        setIsRecording(false);
        if (isLiveVoiceRef.current && event.error !== 'aborted') {
          setTimeout(() => {
            if (isLiveVoiceRef.current && !isSpeaking) {
              listenForLiveVoiceCommand();
            }
          }, 800);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (finalTranscript && finalTranscript.trim()) {
          setLiveVoiceState('processing');
          handleSend(finalTranscript.trim(), true);
        } else if (isLiveVoiceRef.current && !isSpeaking) {
          setTimeout(() => {
            if (isLiveVoiceRef.current && !isSpeaking) {
              listenForLiveVoiceCommand();
            }
          }, 600);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Error starting live voice loop:', e);
      exitLiveVoiceMode();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isLiveVoiceMode) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLiveVoiceMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  const handleSend = async (userText = input, isFromVoiceCall = false) => {
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

      const replyText = aiResponse.reply_message || 'Entendido. Procesé tu solicitud.';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge
        }
      ]);

      // Speak aloud if in voice call or auto-speak is enabled
      if (isFromVoiceCall || isLiveVoiceRef.current || autoSpeak) {
        speakText(replyText, () => {
          if (isLiveVoiceRef.current) {
            listenForLiveVoiceCommand();
          }
        });
      }

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

      if (isFromVoiceCall || isLiveVoiceRef.current) {
        speakText("Hubo un detalle de conexión, intenta de nuevo.", () => {
          if (isLiveVoiceRef.current) {
            listenForLiveVoiceCommand();
          }
        });
      }
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

      {/* Floating Widget Container */}
      {isOpen && (
        <div style={{
          width: '395px',
          height: '550px',
          maxHeight: 'calc(100vh - 80px)',
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '20px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>

          {/* ========================================= */}
          {/* VIEW A: LIVE VOICE CONVERSATION MODE     */}
          {/* ========================================= */}
          {isLiveVoiceMode ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: 'radial-gradient(circle at 50% 30%, hsla(215, 90%, 55%, 0.18), transparent 70%), hsl(var(--bg-card))',
              position: 'relative'
            }}>
              {/* Voice Mode Header */}
              <div style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid hsla(215, 90%, 55%, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    animation: 'pulseDot 1.5s infinite'
                  }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                    Modo Conversación en Vivo
                  </span>
                </div>
                <button
                  onClick={exitLiveVoiceMode}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <PhoneOff size={13} />
                  <span>Salir</span>
                </button>
              </div>

              {/* Voice Orb Area */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                gap: '24px'
              }}>
                {/* Central Pulsating Orb */}
                <div
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else if (liveVoiceState === 'listening') stopListening();
                    else listenForLiveVoiceCommand();
                  }}
                  style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    background: liveVoiceState === 'listening'
                      ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
                      : liveVoiceState === 'processing'
                      ? 'linear-gradient(135deg, #f59e0b, #ec4899)'
                      : 'linear-gradient(135deg, #10b981, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: liveVoiceState === 'listening'
                      ? '0 0 40px rgba(14, 165, 233, 0.6), 0 0 80px rgba(99, 102, 241, 0.3)'
                      : liveVoiceState === 'processing'
                      ? '0 0 40px rgba(245, 158, 11, 0.6)'
                      : '0 0 40px rgba(16, 185, 129, 0.6), 0 0 80px rgba(6, 182, 212, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    animation: liveVoiceState === 'speaking' ? 'orbSpeaking 1s infinite alternate' : 'orbPulse 2s infinite'
                  }}
                  title="Haz clic para pausar o reactivar"
                >
                  {liveVoiceState === 'listening' && <Mic size={42} color="white" />}
                  {liveVoiceState === 'processing' && <RefreshCw size={42} color="white" className="spin-animation" />}
                  {liveVoiceState === 'speaking' && <Volume2 size={42} color="white" />}
                </div>

                {/* State Label */}
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                    {liveVoiceState === 'listening' && '🎙️ Escuchándote...'}
                    {liveVoiceState === 'processing' && '⏳ Procesando en CRM...'}
                    {liveVoiceState === 'speaking' && '🔊 Respondiéndote...'}
                    {liveVoiceState === 'idle' && 'En pausa'}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                    {liveVoiceState === 'listening' && 'Habla con naturalidad, la IA te responderá por voz'}
                    {liveVoiceState === 'processing' && 'Consultando datos y ejecutando acciones'}
                    {liveVoiceState === 'speaking' && 'Escucha la respuesta o habla para interrumpir'}
                    {liveVoiceState === 'idle' && 'Toca el orbe para volver a escuchar'}
                  </p>
                </div>

                {/* Live Speech Feedback */}
                {input && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'hsl(var(--text-secondary))',
                    backgroundColor: 'hsla(0, 0%, 0%, 0.25)',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    maxWidth: '90%',
                    fontStyle: 'italic',
                    border: '1px solid hsl(var(--border-color))'
                  }}>
                    "{input}"
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div style={{
                padding: '14px',
                borderTop: '1px solid hsl(var(--border-color))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'hsla(0, 0%, 0%, 0.2)'
              }}>
                <button
                  type="button"
                  onClick={exitLiveVoiceMode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'hsl(var(--text-secondary))',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquare size={15} />
                  <span>Ver chat escrito</span>
                </button>

                <button
                  type="button"
                  onClick={exitLiveVoiceMode}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '8px 18px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <PhoneOff size={15} />
                  <span>Finalizar</span>
                </button>
              </div>
            </div>

          ) : (

            /* ========================================= */
            /* VIEW B: REGULAR TEXT & DICTATION CHAT    */
            /* ========================================= */
            <>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
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
                    <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                      Conectado a tu CRM en vivo
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Live Voice Call Mode Launcher */}
                  <button
                    onClick={startLiveVoiceMode}
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                      border: 'none',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.35)'
                    }}
                    title="Iniciar conversación continua por voz (Estilo ChatGPT)"
                  >
                    <PhoneCall size={13} />
                    <span>Llamada</span>
                  </button>

                  {/* Auto-read speaker toggle */}
                  <button
                    onClick={() => {
                      if (isSpeaking) stopSpeaking();
                      setAutoSpeak(!autoSpeak);
                    }}
                    style={{
                      background: autoSpeak ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: 'none',
                      color: autoSpeak ? '#3b82f6' : 'hsl(var(--text-muted))',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={autoSpeak ? "Voz activa (leer respuestas)" : "Voz desactivada"}
                  >
                    {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
                      <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>
                        {m.timestamp}
                      </span>
                      {m.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isSpeaking) stopSpeaking();
                            else speakText(m.text);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--text-muted))',
                            cursor: 'pointer',
                            padding: '1px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Escuchar en voz alta"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                    </div>
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
                  placeholder={isRecording ? "🎙️ Escuchando... habla ahora..." : "Escribe o dicta una instrucción..."}
                  className="form-control"
                  style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: isRecording ? '1px solid #ef4444' : undefined,
                    backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.08)' : undefined
                  }}
                  disabled={loading}
                />

                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isRecording ? '#ef4444' : 'hsl(var(--bg-sidebar))',
                    color: isRecording ? 'white' : 'hsl(var(--text-secondary))',
                    border: isRecording ? '1px solid #dc2626' : '1px solid hsl(var(--border-color))',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    animation: isRecording ? 'pulseRecording 1.2s infinite' : 'none'
                  }}
                  title={isRecording ? "Detener dictado por voz" : "Dictar por voz (micrófono)"}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

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
            </>
          )}
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
        @keyframes pulseDot {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes orbPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes orbSpeaking {
          0% { transform: scale(0.96); filter: brightness(1); }
          100% { transform: scale(1.1); filter: brightness(1.25); }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
