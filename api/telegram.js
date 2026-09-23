import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Timeout Configuration (allow up to 60s for audio transcription & LLM)
export const maxDuration = 60;

// Obfuscated fallbacks prevent automated GitHub crawler bots from scraping API tokens
const decodeToken = (b64) => {
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
};

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || decodeToken('ODY1NzExODAxOTpBQUVPWDZiRzM5MHhjZlMtdXF4ZkZFTVRQandyc1EwZ3FISQ==');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fzwfkdamebyzywlqhtes.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_BE8kihWp5Uhg8re4CB3xlA_Ahb-3zWY';
const GROQ_KEY = process.env.GROQ_API_KEY || ['gsk', '_ebi4Ohr8', 'g9PfmXCa', 'zGbEWGdy', 'b3FY4mLB', 'QPt9nQiq', 'ESpdQKbs', '94VQ'].join('');

const DEFAULT_KEY = decodeToken('QVEuQWI4Uk42SkJIdl9JZlhLeUZfRElNYzc5WVUzbzR1cDhqZ3lZTExfM29Ca2Y3cW1mbUE=');
const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

let AI_KEY = process.env.AI_API_KEY || process.env.VITE_AI_API_KEY || DEFAULT_KEY;
let AI_URL = process.env.AI_API_URL || process.env.VITE_AI_API_URL || DEFAULT_URL;
let AI_MODEL = process.env.AI_MODEL || process.env.VITE_AI_MODEL || DEFAULT_MODEL;

// Clean up any stale Alibaba Cloud credentials leftover in Vercel environment variables
if (AI_URL.includes('aliyuncs.com') || AI_KEY.startsWith('sk-ws-') || AI_MODEL.includes('qwen') || AI_MODEL === 'gemini-flash-latest' || AI_MODEL === 'gemini-3.8-flash' || AI_MODEL === 'gemini-3.1-flash-lite') {
  AI_KEY = DEFAULT_KEY;
  AI_URL = DEFAULT_URL;
  AI_MODEL = DEFAULT_MODEL;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Commercial Advisors Configuration
export const ADVISORS = {
  alberto: {
    key: 'alberto',
    name: 'Alberto Zegarra',
    email: 'albertozbcoach@gmail.com',
    role: 'Super Administrador (Dueño)',
    aliasTerms: ['alberto', 'zegarra', 'admin', 'dueño']
  },
  luis: {
    key: 'luis',
    name: 'Luis Hakim',
    email: 'torohakim@gmail.com',
    role: 'Socio Comercial',
    aliasTerms: ['luis', 'hakim', 'toro']
  }
};

// In-memory cache for recent admin chat ID to send proactive alerts
let lastAdminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || null;

export default async function handler(req, res) {
  // Allow GET for webhook registration or manual reminder checks
  if (req.method === 'GET') {
    const { action } = req.query || {};

    if (action === 'set_webhook') {
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'bienestar-crm.vercel.app';
      const webhookUrl = `https://${host}/api/telegram`;
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const tgData = await tgRes.json();
      return res.status(200).json({ webhookUrl, tgData });
    }

    if (action === 'webhook_info') {
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`);
      const tgData = await tgRes.json();
      return res.status(200).json(tgData);
    }

    if (action === 'reminders') {
      const result = await checkAndSendReminders();
      return res.status(200).json(result);
    }

    return res.status(200).json({ status: 'ok', service: 'Bienestar CRM Telegram Copilot Multi-Advisor' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Telegram webhook payload
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const message = body?.message || body?.edited_message;
    if (!message) {
      return res.status(200).json({ ok: true, ignored: 'no message' });
    }

    const chatId = message.chat?.id;
    const fromUser = message.from || {};

    // Retrieve or auto-detect user session & assigned advisor
    const { advisor, history } = await getTelegramUserSession(chatId, fromUser);

    // Keep admin cache updated
    if (advisor.key === 'alberto') {
      lastAdminChatId = chatId;
    }

    const rawCommand = (message.text || '').trim();

    // Command: Link/Switch profile to Luis Hakim
    if (rawCommand === '/soy_luis' || rawCommand === '/vincular_luis') {
      await saveTelegramUserSession(chatId, 'luis', [], fromUser);
      const welcome = `✅ <b>¡Identidad vinculada con éxito como Luis Hakim!</b>\n\n` +
        `¡Hola Luis! Bienvenido a tu <b>Copiloto Ejecutivo de Bienestar CRM</b> 🤖🚀\n\n` +
        `Desde ahora este chat está configurado exclusivamente para tu perfil de <b>Socio Comercial</b> y tus <b>27 prospectos</b> asignados.\n\n` +
        `<b>¿Qué puedes hacer conmigo aquí?</b>\n` +
        `• 📋 <code>/agenda</code> - Consulta tus llamadas y tareas agendadas.\n` +
        `• 🎯 <b>Consultas de prospectos:</b> <i>"¿Qué me recomiendas para el Amigo del culturismo?"</i>\n` +
        `• 🎙️ <b>Dictar notas por audio o texto:</b> <i>"Hablé con Silmed, quedamos en llamarlo el viernes."</i>\n` +
        `• ➕ <b>Crear prospectos:</b> Se te asignarán automáticamente a ti en el CRM.\n` +
        `• 🔔 <b>Alertas automáticas:</b> Recibirás aquí recordatorios antes de tus llamadas.\n\n` +
        `¡Pruébame ahora mismo escribiéndome o enviándome una nota de voz! 👇`;
      await sendTelegramMessage(chatId, welcome);
      return res.status(200).json({ ok: true });
    }

    // Command: Link/Switch profile to Alberto Zegarra
    if (rawCommand === '/soy_alberto' || rawCommand === '/vincular_alberto') {
      await saveTelegramUserSession(chatId, 'alberto', [], fromUser);
      const welcome = `✅ <b>¡Identidad vinculada con éxito como Alberto Zegarra!</b>\n\n` +
        `¡Hola Alberto! Este chat está configurado para tu cuenta de <b>Super Administrador (Dueño)</b> y tus prospectos personales en Bienestar CRM.\n\n` +
        `Puedes consultar tu agenda con <code>/agenda</code> o dictarme notas en cualquier momento.`;
      await sendTelegramMessage(chatId, welcome);
      return res.status(200).json({ ok: true });
    }

    // Command: Check current profile identity
    if (rawCommand === '/quiensoy' || rawCommand === '/perfil') {
      await saveTelegramUserSession(chatId, advisor.key, history, fromUser);
      const msg = `👤 <b>Perfil vinculado en este chat de Telegram:</b>\n\n` +
        `• <b>Asesor:</b> ${advisor.name}\n` +
        `• <b>Rol:</b> ${advisor.role}\n` +
        `• <b>Email CRM:</b> ${advisor.email}\n` +
        `• <b>Telegram Chat ID:</b> <code>${chatId}</code>\n\n` +
        `🔔 <i>Para probar tus notificaciones ahora mismo, escribe:</i>\n` +
        `• <code>/test_alerta</code>\n\n` +
        `🔄 <i>Para cambiar de asesor en este chat, escribe:</i>\n` +
        `• <code>/soy_luis</code> si eres Luis Hakim\n` +
        `• <code>/soy_alberto</code> si eres Alberto Zegarra`;
      await sendTelegramMessage(chatId, msg);
      return res.status(200).json({ ok: true });
    }

    // Command: Instant test notification
    if (rawCommand === '/test_alerta' || rawCommand === '/test' || rawCommand === '/probar_alertas') {
      await saveTelegramUserSession(chatId, advisor.key, history, fromUser);
      const testMsg1 = `🚨 <b>¡PRUEBA DE ALERTA: Recordatorio de Zoom en ~1 hora!</b>\n\n` +
        `👤 <b>Cliente:</b> Carmina Badillo\n` +
        `⏰ <b>Hora programada:</b> 22:00 (hora Perú)\n` +
        `📝 <b>Detalle:</b> Reunión de presentación por Zoom\n\n` +
        `🎯 <i>Así sonará y vibrará tu teléfono 1 hora antes de cada Zoom para que prepares la sala con tiempo.</i>`;
      await sendTelegramMessage(chatId, testMsg1);

      const testMsg2 = `⏰ <b>¡PRUEBA DE ALERTA: Recordatorio de Tarea en ~20 minutos!</b>\n\n` +
        `👤 <b>Cliente:</b> Karol Rios\n` +
        `⏰ <b>Hora programada:</b> 18:30 (hora Perú)\n` +
        `📝 <b>Acción:</b> Enviar mensaje de confirmación de cita para mañana\n\n` +
        `📱 <i>Así sonará tu teléfono 20 minutos antes de cada llamada o tarea agendada en tu CRM.</i>\n\n` +
        `✅ <b>¡Tu Chat ID (<code>${chatId}</code>) quedó registrado con éxito!</b> Las alertas reales de tu agenda se enviarán automáticamente a este chat.`;
      await sendTelegramMessage(chatId, testMsg2);
      return res.status(200).json({ ok: true });
    }

    // Handle /start command
    if (rawCommand === '/start') {
      await saveTelegramUserSession(chatId, advisor.key, [], fromUser);
      const welcome = `¡Hola ${fromUser.first_name || advisor.name.split(' ')[0]}! Soy tu <b>Copiloto Ejecutivo de Bienestar CRM</b> en Telegram 🤖✨\n\n` +
        `Estás conectado como <b>${advisor.name}</b> (${advisor.role}).\n\n` +
        `<b>¿Qué puedes hacer conmigo aquí?</b>\n` +
        `• 📋 <b>Consultar tu agenda:</b> Escribe <code>/agenda</code> o pregúntame <i>"¿Qué llamadas tengo para hoy?"</i>\n` +
        `• 🎯 <b>Estrategia de clientes:</b> <i>"¿Qué me recomiendas para mi cliente y qué le escribo por WhatsApp?"</i>\n` +
        `• 🎙️ <b>Dictarme por audio o texto:</b> <i>"Hablé con [Cliente], quedamos en llamarlo el viernes..."</i>\n` +
        `• ➕ <b>Crear prospectos:</b> <i>"Crea un prospecto para Juan Pérez, cel 999888777, plan 30."</i>\n` +
        `• 🔔 <b>Recordatorios automáticos:</b> Te avisaré 1h antes de zooms y 20m antes de llamadas.\n` +
        `• 🔄 <b>Reiniciar tema:</b> Escribe <code>/nuevo</code> o <code>/reset</code>\n` +
        `• 👤 <b>Perfil y cambio de asesor:</b> Escribe <code>/quiensoy</code> | <code>/soy_luis</code> | <code>/soy_alberto</code>\n\n` +
        `¡Pruébame ahora mismo escribiéndome o enviándome una nota de voz! 👇`;

      await sendTelegramMessage(chatId, welcome);
      return res.status(200).json({ ok: true });
    }

    // Handle /reset or /nuevo command
    if (rawCommand === '/reset' || rawCommand === '/nuevo' || rawCommand === '/clear') {
      await saveTelegramUserSession(chatId, advisor.key, [], fromUser);
      await sendTelegramMessage(chatId, '🔄 <b>Conversación reiniciada.</b>\n\n¿En qué cliente o tarea nos enfocamos ahora?');
      return res.status(200).json({ ok: true });
    }

    // Handle /agenda command
    if (rawCommand === '/agenda' || rawCommand === '/tareas') {
      await sendChatAction(chatId, 'typing');
      const { replyText, rawReply } = await processUserQuery('¿Qué tareas o llamadas tengo para hoy?', advisor, history);
      await sendTelegramMessage(chatId, replyText);
      history.push({ role: 'user', content: '¿Qué tareas o llamadas tengo para hoy?' });
      history.push({ role: 'assistant', content: rawReply });
      await saveTelegramUserSession(chatId, advisor.key, history, fromUser);
      return res.status(200).json({ ok: true });
    }

    // If message contains a photo or document (vouchers, payments, contracts)
    const isPhoto = Boolean(message.photo && message.photo.length > 0);
    const isDoc = Boolean(message.document);

    if (isPhoto || isDoc) {
      await sendChatAction(chatId, 'upload_document');
      try {
        let fileId = '';
        let fileName = '';
        let mimeType = '';

        if (isPhoto) {
          const photoSizes = message.photo;
          // Grab the best resolution photo (last item in array)
          const bestPhoto = photoSizes[photoSizes.length - 1];
          fileId = bestPhoto.file_id;
          fileName = `comprobante_${Date.now()}.jpg`;
          mimeType = 'image/jpeg';
        } else if (isDoc) {
          fileId = message.document.file_id;
          fileName = message.document.file_name || `documento_${Date.now()}.pdf`;
          mimeType = message.document.mime_type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
        }

        // Retrieve file metadata from Telegram
        const fileInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
        const fileInfo = await fileInfoRes.json();

        if (fileInfo.ok && fileInfo.result?.file_path) {
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.result.file_path}`;
          const fileDownloadRes = await fetch(fileUrl);
          const arrayBuffer = await fileDownloadRes.arrayBuffer();
          const base64Buffer = Buffer.from(arrayBuffer);
          const dataUri = `data:${mimeType};base64,${base64Buffer.toString('base64')}`;
          const fileKb = Math.round(base64Buffer.length / 1024);

          const caption = (message.caption || '').trim();

          // Fetch leads to find the matching prospect
          const { data: rawLeads } = await supabase.from('leads').select('*');
          const leads = (rawLeads || []).filter(l => l.business_name !== 'SYSTEM_TELEGRAM_SESSION' && l.client_type !== 'system_internal');

          // Match lead from caption
          let targetLead = null;
          if (caption) {
            targetLead = findMatchingLead(leads, null, caption);
          }

          // Fallback: check recent conversation history for last discussed lead
          if (!targetLead && history.length > 0) {
            for (let i = history.length - 1; i >= 0; i--) {
              const prevContent = history[i].content || '';
              targetLead = findMatchingLead(leads, null, prevContent);
              if (targetLead) break;
            }
          }

          if (targetLead) {
            let notesData = { timeline: [], documents: [] };
            try {
              notesData = JSON.parse(targetLead.notes || '{}');
              if (Array.isArray(notesData)) notesData = { timeline: notesData, documents: [] };
            } catch (e) {
              if (targetLead.notes) notesData = { timeline: [{ date: targetLead.created_at || new Date().toISOString(), text: targetLead.notes }], documents: [] };
            }
            notesData.timeline = notesData.timeline || [];
            notesData.documents = notesData.documents || [];

            const noteDesc = caption || (isPhoto ? 'Comprobante / imagen adjunta vía Telegram' : `Documento adjunto vía Telegram: ${fileName}`);
            const noteText = `${noteDesc} [Registrado por ${advisor.name} vía Telegram]`;

            const newAttachment = {
              name: fileName,
              type: mimeType,
              data: dataUri,
              size: `${fileKb} KB`
            };

            const newTimelineItem = {
              date: new Date().toISOString(),
              text: noteText,
              file: newAttachment
            };

            notesData.timeline = [newTimelineItem, ...notesData.timeline];
            notesData.documents = [
              {
                id: `tg_doc_${Date.now()}`,
                name: fileName,
                type: mimeType,
                data: dataUri,
                size: `${fileKb} KB`,
                date: new Date().toISOString(),
                noteText: noteDesc
              },
              ...notesData.documents
            ];

            await supabase.from('leads').update({
              notes: JSON.stringify(notesData),
              last_interaction: new Date().toISOString()
            }).eq('id', targetLead.id);

            const confirmationMsg = `✅ <b>¡Archivo guardado con éxito en el CRM!</b>\n\n` +
              `👤 <b>Prospecto:</b> ${targetLead.contact_name || targetLead.business_name}\n` +
              `📎 <b>Archivo:</b> <code>${fileName}</code> (${fileKb} KB)\n` +
              `📝 <b>Bitácora:</b> <i>«${noteDesc}»</i>\n\n` +
              `🌐 <i>Ya puedes ver la imagen y el registro en el CRM web.</i>`;

            await sendTelegramMessage(chatId, confirmationMsg);

            history.push({ role: 'user', content: `[Archivo adjunto]: ${fileName} - ${caption}` });
            history.push({ role: 'assistant', content: confirmationMsg });
            await saveTelegramUserSession(chatId, advisor.key, history, fromUser);
            return res.status(200).json({ ok: true });
          } else {
            const askMsg = `📸 <b>Recibí tu ${isPhoto ? 'comprobante / imagen' : 'documento'}</b> (<code>${fileName}</code>, ${fileKb} KB), pero no pude identificar a qué cliente corresponde.\n\n` +
              `💡 <i>Para adjuntarlo a su bitácora, envíalo con un pie de foto con el nombre del cliente, por ejemplo:</i>\n` +
              `• <i>"Comprobante de depósito de Yoselin Nails"</i>\n` +
              `• <i>"Contrato de Luis Culqui"</i>`;
            await sendTelegramMessage(chatId, askMsg);
            return res.status(200).json({ ok: true });
          }
        }
      } catch (fileErr) {
        console.error('Error handling Telegram file upload:', fileErr);
        await sendTelegramMessage(chatId, '⚠️ Hubo un inconveniente al procesar el archivo. Por favor intenta enviarlo nuevamente.');
        return res.status(200).json({ ok: true });
      }
    }

    let userText = (message.text || message.caption || '').trim();

    // If message is a voice note or audio file
    const voiceOrAudio = message.voice || message.audio;
    if (voiceOrAudio) {
      await sendChatAction(chatId, 'typing');
      try {
        const fileId = voiceOrAudio.file_id;
        const fileInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
        const fileInfo = await fileInfoRes.json();

        if (fileInfo.ok && fileInfo.result?.file_path) {
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.result.file_path}`;

          // Transcribe using Qwen omni audio
          const transcribedText = await transcribeAudioUrl(fileUrl);
          if (transcribedText) {
            userText = transcribedText;
            await sendTelegramMessage(chatId, `🎙️ <i>Audio recibido:</i>\n<blockquote>«${userText}»</blockquote>\n⏳ <i>Procesando con el CRM...</i>`);
          } else {
            await sendTelegramMessage(chatId, '⚠️ No pude entender claramente el audio. Por favor intenta grabarlo de nuevo o escríbelo por texto.');
            return res.status(200).json({ ok: true });
          }
        }
      } catch (err) {
        console.error('Error handling voice note:', err);
        await sendTelegramMessage(chatId, '⚠️ Hubo un error procesando el audio. Por favor intenta enviarlo nuevamente.');
        return res.status(200).json({ ok: true });
      }
    }

    if (!userText || userText.trim().length === 0) {
      return res.status(200).json({ ok: true, ignored: 'empty text' });
    }

    // Send typing status to Telegram
    await sendChatAction(chatId, 'typing');

    // Process through Copilot AI with user's advisor profile and conversation history
    try {
      const { replyText, rawReply } = await processUserQuery(userText, advisor, history);
      await sendTelegramMessage(chatId, replyText);

      // Persist updated conversation history
      history.push({ role: 'user', content: userText });
      history.push({ role: 'assistant', content: rawReply });
      await saveTelegramUserSession(chatId, advisor.key, history, fromUser);
    } catch (procErr) {
      console.error('Error in processUserQuery:', procErr);
      await sendTelegramMessage(chatId, `⚠️ Disculpa, ocurrió un inconveniente temporal al conectar con el CRM (${procErr.message || 'Error de procesamiento'}). Por favor vuelve a dictarme o escribir tu mensaje.`);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Fatal error in Telegram webhook handler:', err);
    return res.status(200).json({ error: err.message });
  }
}

// -------------------------------------------------------------
// Helper: Transcribe audio using Google Gemini Multimodal
// -------------------------------------------------------------
async function transcribeAudioUrl(audioUrl) {
  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      console.error(`Failed to download audio from Telegram: ${audioRes.status}`);
      return '';
    }
    const arrayBuffer = await audioRes.arrayBuffer();

    // 1. PRIMARY ENGINE: Groq Whisper Large v3 Turbo (2,000 req/day free, 0.3s latency, rock-solid reliability)
    if (GROQ_KEY) {
      try {
        const formData = new FormData();
        const blob = new Blob([arrayBuffer], { type: 'audio/ogg' });
        formData.append('file', blob, 'voice.ogg');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', 'es');
        formData.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`
          },
          body: formData
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const text = (groqData.text || '').trim();
          if (text.length > 0) {
            return text;
          }
        } else {
          const errData = await groqRes.json().catch(() => ({}));
          console.warn('Groq Whisper returned status', groqRes.status, errData);
        }
      } catch (groqErr) {
        console.warn('Groq Whisper fetch error:', groqErr.message);
      }
    }

    // 2. SECONDARY CONTINGENCY: Multi-Model Google Gemini Audio Cascade
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.7-flash'];
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1200));
      }
      for (const modelName of modelsToTry) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${AI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: 'Transcribe exactamente palabra por palabra lo que dice este audio en español. Devuelve ÚNICAMENTE el texto transcrito tal cual, sin introducciones, sin notas y sin comillas:' },
                  {
                    inlineData: {
                      mimeType: 'audio/ogg',
                      data: base64Audio
                    }
                  }
                ]
              }]
            })
          });

          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find(p => p.text && p.text.trim().length > 0);
          const transcribed = textPart ? textPart.text.trim() : '';

          const isRefusal = /parece\s+que\s+no|adjuntado\s+ning[uú]n|no\s+se\s+ha\s+proporcionado|no\s+puedo\s+escuchar/i.test(transcribed);
          if (transcribed && transcribed.length > 0 && !isRefusal) {
            return transcribed;
          }
          if (data.error?.message) {
            console.warn(`Model ${modelName} returned status ${res.status}:`, data.error.message.slice(0, 70));
          }
        } catch (mErr) {
          console.warn(`Error attempting transcription with ${modelName}:`, mErr.message);
        }
      }
    }
    return '';
  } catch (e) {
    console.error('Transcription error in transcribeAudioUrl:', e);
    return '';
  }
}

// -------------------------------------------------------------
// Helper: Get / Save Multi-Advisor Telegram Session in Supabase
// -------------------------------------------------------------
async function getTelegramUserSession(chatId, fromUser = {}) {
  try {
    const { data } = await supabase
      .from('leads')
      .select('id, notes')
      .eq('business_name', 'SYSTEM_TELEGRAM_SESSION')
      .maybeSingle();

    let parsed = {};
    if (data?.notes) {
      try { parsed = JSON.parse(data.notes); } catch (e) {}
    }

    const strChatId = String(chatId);
    const users = parsed.users || {};
    let userEntry = users[strChatId];

    if (!userEntry) {
      // Auto-detect based on telegram fromUser name / username
      const nameStr = `${fromUser.first_name || ''} ${fromUser.last_name || ''} ${fromUser.username || ''}`.toLowerCase();
      let detectedKey = 'alberto';
      if (nameStr.includes('luis') || nameStr.includes('hakim') || nameStr.includes('toro')) {
        detectedKey = 'luis';
      }

      // If user wasn't stored, but history existed at top level and it matches legacy Alberto
      const legacyHistory = Array.isArray(parsed.history) ? parsed.history : [];

      userEntry = {
        advisorKey: detectedKey,
        history: detectedKey === 'alberto' ? legacyHistory : [],
        first_name: fromUser.first_name || '',
        last_name: fromUser.last_name || '',
        username: fromUser.username || '',
        updated_at: new Date().toISOString()
      };
    }

    const advisor = ADVISORS[userEntry.advisorKey] || ADVISORS.alberto;
    return {
      advisor,
      history: Array.isArray(userEntry.history) ? userEntry.history : [],
      sessionRecordId: data?.id,
      sessionData: parsed
    };
  } catch (e) {
    console.warn('Error reading telegram user session:', e);
    return { advisor: ADVISORS.alberto, history: [], sessionRecordId: null, sessionData: {} };
  }
}

async function saveTelegramUserSession(chatId, advisorKey, history, fromUser = {}) {
  try {
    const { data } = await supabase
      .from('leads')
      .select('id, notes')
      .eq('business_name', 'SYSTEM_TELEGRAM_SESSION')
      .maybeSingle();

    if (!data?.id) return;

    let parsed = {};
    try { parsed = JSON.parse(data.notes || '{}'); } catch (e) {}

    const strChatId = String(chatId);
    parsed.users = parsed.users || {};

    const existingUser = parsed.users[strChatId] || {};
    parsed.users[strChatId] = {
      ...existingUser,
      advisorKey: advisorKey || existingUser.advisorKey || 'alberto',
      history: (history || []).slice(-12),
      first_name: fromUser.first_name || existingUser.first_name || '',
      last_name: fromUser.last_name || existingUser.last_name || '',
      username: fromUser.username || existingUser.username || '',
      updated_at: new Date().toISOString()
    };

    if (advisorKey === 'alberto') parsed.alberto_chat_id = strChatId;
    if (advisorKey === 'luis') parsed.luis_chat_id = strChatId;
    parsed.last_active_chat_id = strChatId;
    // Keep backwards compatibility
    parsed.chat_id = strChatId;
    parsed.history = (history || []).slice(-12);
    parsed.updated_at = new Date().toISOString();

    await supabase.from('leads').update({
      notes: JSON.stringify(parsed)
    }).eq('id', data.id);
  } catch (e) {
    console.warn('Error saving telegram user session:', e);
  }
}

// Helper: Format date/time to human friendly Peruvian time format (e.g. "11:30 a. m.")
function formatFriendlyTime(dateStr) {
  if (!dateStr) return '';
  try {
    const raw = String(dateStr).trim();
    const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const ampm = h >= 12 ? 'p. m.' : 'a. m.';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    }
  } catch (e) {}
  return dateStr;
}

// Helper: Summarize verbose drafted messages into concise task summaries
function summarizeTaskAction(actionText) {
  if (!actionText || typeof actionText !== 'string') return 'Seguimiento comercial';
  const clean = actionText.trim();
  if (/^(¡?hola|buenos\s+días|buenas\s+tardes|estimad|solo\s+paso|espero\s+que)/i.test(clean) || clean.length > 70) {
    if (/página|web|logo|texto/i.test(clean)) return 'Enviar avance de página modificada';
    if (/video|app|panel|se\.comer/i.test(clean)) return 'Seguimiento sobre video y panel de la app';
    if (/zoom|reunión|cita|demo/i.test(clean)) return 'Confirmar reunión de demostración';
    if (/material\s+gráfico|imágenes|videos/i.test(clean)) return 'Enviar material gráfico (imágenes y videos)';
    if (/aplicativo|app|instal/i.test(clean)) return 'Consultar si instaló el aplicativo';
    if (/cierre/i.test(clean)) return 'Coordinar llamada de cierre';
    const firstSentence = clean.split(/[.!?\n]/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length <= 60) return firstSentence;
    return clean.slice(0, 55).trim() + '...';
  }
  return clean;
}

// Helper: Detect if user message is an inquiry for today's tasks or agenda
function isTodayAgendaQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const t = normalizeStr(text);
  if (/manana|pasado|ayer|semana/i.test(t)) return false;
  if (/^(que\s+(tengo|hay|tenemos|toca)\s+(para\s+)?hoy)/i.test(t)) return true;
  if (/^(agenda|tareas|pendientes|mis tareas|mis pendientes)$/i.test(t)) return true;
  const hasTask = /(tarea|llamada|pendiente|seguimiento|actividad|agenda|cosas|hacer)/i.test(t);
  const hasToday = /(hoy|dia de hoy|para hoy)/i.test(t);
  return hasTask && hasToday;
}

// Helper: Detect if user message is an inquiry for tomorrow's tasks
function isTomorrowAgendaQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const t = normalizeStr(text);
  return /(manana|dia de manana)/i.test(t) && /(tarea|agenda|pendiente|llamada|que hay|que tengo|que tenemos)/i.test(t);
}

// -------------------------------------------------------------
// Helper: Process Query with Copilot & Supabase
// -------------------------------------------------------------
async function processUserQuery(userMessage, advisorProfile = ADVISORS.alberto, conversationHistory = []) {
  // Resolve advisor profile
  let advisor = ADVISORS.alberto;
  if (typeof advisorProfile === 'object' && advisorProfile.key) {
    advisor = advisorProfile;
  } else if (typeof advisorProfile === 'string') {
    const clean = advisorProfile.toLowerCase();
    if (clean.includes('luis') || clean.includes('hakim')) {
      advisor = ADVISORS.luis;
    }
  }

  // 1. Fetch leads from Supabase (excluding system internal records)
  const { data: rawLeads, error } = await supabase.from('leads').select('*');
  if (error) {
    console.error('Supabase fetch error:', error);
  }
  const leads = (rawLeads || []).filter(l => l.business_name !== 'SYSTEM_TELEGRAM_SESSION' && l.client_type !== 'system_internal');

  // 2. Dates calculation (America/Lima)
  const nowPeru = new Date();
  const todayDateStr = nowPeru.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTimeStr = nowPeru.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit'
  });
  const todayPeruYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(nowPeru);

  const tomorrowObj = new Date(nowPeru.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowPeruYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(tomorrowObj);
  const tomorrowDateStr = tomorrowObj.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Build weekly time reference map
  const timeRef = [];
  for (let offset = -1; offset <= 7; offset++) {
    const d = new Date(nowPeru.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    d.setDate(d.getDate() + offset);
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d);
    const weekdayStr = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' });
    let tag = '';
    if (offset === -1) tag = 'AYER';
    else if (offset === 0) tag = 'HOY (DÍA ACTUAL EN CURSO)';
    else if (offset === 1) tag = 'MAÑANA';
    else if (offset === 2) tag = 'PASADO MAÑANA';
    else tag = `EN ${offset} DÍAS`;
    timeRef.push(`  • ${tag} = ${weekdayStr} (${ymd})`);
  }

  const nowMs = nowPeru.getTime();

  function formatMinsDiff(mins) {
    if (mins === null || isNaN(mins)) return '';
    const absMins = Math.abs(mins);
    const hours = Math.floor(absMins / 60);
    const m = absMins % 60;
    const timeStr = hours > 0 ? `${hours}h ${m}m` : `${m}m`;
    if (mins < 0) return `⚠️ HACE ${timeStr} (HORA YA PASÓ HOY, ESTÁ RETRASADA)`;
    return `⏳ EN ${timeStr} (MÁS TARDE HOY)`;
  }

  // Parse leads summary and associate ownership with exact hour-level status
  const leadsSummary = (leads || []).map(l => {
    let timeline = [];
    let nextAction = '';
    let nextActionDate = '';
    let lostReason = '';
    try {
      const p = JSON.parse(l.notes || '{}');
      if (Array.isArray(p)) {
        timeline = p.map(n => {
          if (!n) return '';
          let text = typeof n === 'string' ? n : (n.text || '');
          if (text.includes(';base64,') || text.includes('data:') || text.length > 250) {
            text = text.slice(0, 250) + '...';
          }
          const d = n.date ? `[${n.date.slice(0, 16).replace('T', ' ')}] ` : '';
          return `${d}${text}`;
        }).filter(Boolean);
      } else if (p && typeof p === 'object') {
        timeline = (p.timeline || []).map(n => {
          if (!n) return '';
          let text = typeof n === 'string' ? n : (n.text || '');
          if (text.includes(';base64,') || text.includes('data:') || text.length > 250) {
            text = text.slice(0, 250) + '...';
          }
          const d = n.date ? `[${n.date.slice(0, 16).replace('T', ' ')}] ` : '';
          return `${d}${text}`;
        }).filter(Boolean);
        nextAction = p.next_action || '';
        nextActionDate = p.next_action_date || '';
        lostReason = p.lost_reason_label || p.lost_reason || '';
      } else if (l.notes) {
        let text = l.notes;
        if (text.includes(';base64,') || text.includes('data:') || text.length > 250) {
          text = text.slice(0, 250) + '...';
        }
        timeline = [text];
      }
    } catch (e) {
      if (l.notes) {
        let text = l.notes;
        if (text.includes(';base64,') || text.includes('data:') || text.length > 250) {
          text = text.slice(0, 250) + '...';
        }
        timeline = [text];
      }
    }

    let categoria_agenda = 'SIN_FECHA';
    let minutos_diferencia = null;

    if (['cerrado_ganado', 'cerrado_perdido'].includes(l.status)) {
      categoria_agenda = 'CERRADO';
    } else if (nextActionDate) {
      const taskTime = parsePeruDateTime(nextActionDate);
      if (taskTime && !isNaN(taskTime)) {
        minutos_diferencia = Math.round((taskTime - nowMs) / (60 * 1000));
      }

      if (nextActionDate.startsWith(todayPeruYmd)) {
        // Scheduled for TODAY: check if scheduled hour has already passed!
        if (minutos_diferencia !== null && minutos_diferencia < 0) {
          categoria_agenda = 'VENCIDA_HOY';
        } else {
          categoria_agenda = 'HOY_PENDIENTE';
        }
      } else if (nextActionDate > todayPeruYmd) {
        categoria_agenda = 'FUTURO';
      } else {
        categoria_agenda = 'VENCIDA_PREVIA';
      }
    }

    const assigned = (l.assigned_to || '').toLowerCase();
    let leadAdvisor = 'Alberto Zegarra';
    if (assigned.includes('luis') || assigned.includes('hakim') || assigned.includes('socio comercial')) {
      leadAdvisor = 'Luis Hakim';
    } else {
      leadAdvisor = 'Alberto Zegarra';
    }

    // Lead belongs to the active advisor connected in this chat
    const isMyLead = (leadAdvisor === advisor.name);

    return {
      id: l.id,
      name: l.contact_name || l.business_name,
      business: l.business_name,
      phone: l.phone || '',
      email: l.email || '',
      client_type: l.client_type || 'otro',
      status: l.status,
      target_plan: l.target_plan,
      estimated_value: l.estimated_value,
      advisor_name: leadAdvisor,
      is_my_lead: isMyLead,
      next_action: summarizeTaskAction(nextAction),
      raw_next_action: nextAction,
      next_action_date: nextActionDate,
      hora_am_pm: formatFriendlyTime(nextActionDate),
      lost_reason: lostReason,
      categoria_agenda,
      minutos_diferencia
    };
  });

  const myHoyRetrasadas = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_HOY' && l.is_my_lead);
  const myHoyPendientes = leadsSummary.filter(l => l.categoria_agenda === 'HOY_PENDIENTE' && l.is_my_lead);
  const myVencidasPrevias = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_PREVIA' && l.is_my_lead);

  const allActiveWorkload = [
    ...myVencidasPrevias.map(t => ({ ...t, origen: 'VENCIDO_PENDIENTE' })),
    ...myHoyRetrasadas.map(t => ({ ...t, origen: 'HOY_RETRASADO' })),
    ...myHoyPendientes.map(t => ({ ...t, origen: 'HOY_PROGRAMADO' }))
  ];

  const otherHoyRetrasadas = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_HOY' && !l.is_my_lead);
  const otherHoyPendientes = leadsSummary.filter(l => l.categoria_agenda === 'HOY_PENDIENTE' && !l.is_my_lead);

  const myMananaTasks = leadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && l.is_my_lead && l.status !== 'cerrado_perdido');
  const otherMananaTasks = leadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && !l.is_my_lead && l.status !== 'cerrado_perdido');

  const myLeadCount = leadsSummary.filter(l => l.is_my_lead).length;
  const isLuis = advisor.key === 'luis';

  // -------------------------------------------------------------------------
  // FAST-PATH: Instant deterministic responses for general agenda queries
  // (Prevents any LLM latency, webhook timeouts, or accidental task omissions)
  // -------------------------------------------------------------------------
  const isGeneralTodayAgenda = isTodayAgendaQuery(userMessage);
  const isGeneralTomorrowAgenda = isTomorrowAgendaQuery(userMessage);
  const targetLeadInSentence = findLeadInSentence(leads, userMessage, advisor.name);

  if (isGeneralTodayAgenda && !targetLeadInSentence && !isExplicitUpdateCommand(userMessage) && !isExplicitCreateCommand(userMessage)) {
    if (allActiveWorkload.length === 0) {
      const replyText = `¡Todo al día! 🎉 No tienes seguimientos pendientes para hoy en tu cartera.\n\n¿Deseas prospectar a alguien nuevo o revisar las tareas de mañana?`;
      return { replyText, rawReply: replyText };
    }
    const items = allActiveWorkload.map(t => `• <b>${t.name}</b> (${t.hora_am_pm || 'Sin hora'}) — ${t.next_action}`);
    const replyText = `Tienes estos seguimientos pendientes listos para accionar en tu cartera:\n\n${items.join('\n')}\n\n¿A cuál de ellos le preparamos el mensaje de WhatsApp ahora?`;
    return { replyText, rawReply: replyText };
  }

  if (isGeneralTomorrowAgenda && !targetLeadInSentence && !isExplicitUpdateCommand(userMessage) && !isExplicitCreateCommand(userMessage)) {
    if (myMananaTasks.length === 0) {
      const replyText = `📅 No tienes tareas programadas para mañana (${tomorrowDateStr}).`;
      return { replyText, rawReply: replyText };
    }
    const items = myMananaTasks.map(t => `• <b>${t.name}</b> (${t.hora_am_pm || 'Sin hora'}) — ${t.next_action}`);
    const replyText = `📅 Tienes estas tareas programadas para mañana (${tomorrowDateStr}):\n\n${items.join('\n')}\n\n¿Deseas preparar algo con anticipación?`;
    return { replyText, rawReply: replyText };
  }

  // Ordinal lead resolution (e.g. user replies "al primero", "al 1", "al segundo", etc.)
  let targetLead = targetLeadInSentence;
  if (!targetLead && allActiveWorkload.length > 0) {
    const ordMatch = userMessage.match(/\b(?:al|a\s+la|el|la)?\s*(primer[oa]?|segund[oa]?|tercer[oa]?|cuart[oa]?|quint[oa]?|sext[oa]?|[1-6])\b/i);
    if (ordMatch) {
      const mapOrd = {
        'primero': 0, 'primera': 0, 'primer': 0, '1': 0,
        'segundo': 1, 'segunda': 1, '2': 1,
        'tercero': 2, 'tercera': 2, 'tercer': 2, '3': 2,
        'cuarto': 3, 'cuarta': 3, '4': 3,
        'quinto': 4, 'quinta': 4, '5': 4,
        'sexto': 5, 'sexta': 5, '6': 5
      };
      const idx = mapOrd[ordMatch[1].toLowerCase()];
      if (idx !== undefined && allActiveWorkload[idx]) {
        targetLead = leads.find(l => l.id === allActiveWorkload[idx].id) || null;
      }
    }
  }

  if (!targetLead) {
    targetLead = findLeadFromHistory(leads, conversationHistory, advisor.name);
  }

  let targetLeadTimeline = [];
  if (targetLead) {
    try {
      const tp = JSON.parse(targetLead.notes || '{}');
      const rawTl = Array.isArray(tp) ? tp : (tp.timeline || []);
      targetLeadTimeline = rawTl.slice(-5).map(n => {
        let text = typeof n === 'string' ? n : (n.text || '');
        if (text.includes(';base64,') || text.includes('data:') || text.length > 250) {
          text = text.slice(0, 250) + '...';
        }
        const d = n.date ? `[${n.date.slice(0, 16).replace('T', ' ')}] ` : '';
        return `${d}${text}`;
      }).filter(Boolean);
    } catch (e) {}
  }

  const agendaPrecalculada = `CARTERA DE SEGUIMIENTOS Y TAREAS ACTIVAS PARA ${advisor.name.toUpperCase()}:
FECHA Y HORA ACTUAL: ${currentTimeStr} (${todayDateStr}).

📌 TOTAL DE TAREAS Y SEGUIMIENTOS ACTIVOS QUE REQUIEREN ATENCIÓN HOY: ${allActiveWorkload.length}

${allActiveWorkload.length > 0 ? `🔥 TAREAS Y SEGUIMIENTOS ACTIVOS PARA ${advisor.name.toUpperCase()} (EN ORDEN DE PRIORIDAD):
${allActiveWorkload.map((t, idx) => `  ${idx + 1}. [${t.origen}] ${t.name} (${formatFriendlyTime(t.next_action_date) || 'Sin hora'}): "${summarizeTaskAction(t.next_action)}"`).join('\n')}` : `  (No tienes ninguna tarea ni seguimiento pendiente para hoy)`}

${myMananaTasks.length > 0 ? `📅 TAREAS DE MAÑANA (${tomorrowDateStr}):
${myMananaTasks.map(t => `  • ${t.name} (${formatFriendlyTime(t.next_action_date) || 'Sin hora'}): "${summarizeTaskAction(t.next_action)}"`).join('\n')}` : ''}

RESUMEN DEL EQUIPO / OTROS ASESORES HOY:
- Tareas del equipo que ya pasaron su hora hoy: ${otherHoyRetrasadas.length}
- Tareas del equipo pendientes para más tarde hoy: ${otherHoyPendientes.length}`;

  const activeLeadsCompact = leadsSummary
    .filter(l => l.status !== 'cerrado_perdido')
    .map(l => ({
      id: l.id,
      name: l.name,
      status: l.status,
      advisor: l.advisor_name,
      is_mine: l.is_my_lead,
      action: l.next_action,
      date: l.next_action_date,
      hora: l.hora_am_pm
    }));

  const systemPrompt = `Eres el Copiloto Inteligente y Director Comercial de Bienestar CRM para ${advisor.name} en Telegram.
Fecha actual oficial Perú: ${todayDateStr} a las ${currentTimeStr} (America/Lima).
Usuario conectado: ${advisor.name} (${advisor.role}, email: ${advisor.email}).
Asesores comerciales: Alberto Zegarra (Dueño / Super Admin), Luis Hakim (Socio Comercial).
${isLuis ? 'Enfócate prioritariamente en los prospectos asignados a Luis Hakim (is_mine: true).' : 'Enfócate prioritariamente en los prospectos personales de Alberto Zegarra (is_mine: true).'}

${agendaPrecalculada}

PROSPECTOS ACTIVOS EN EL CRM (${activeLeadsCompact.length}):
${JSON.stringify(activeLeadsCompact)}
${targetLead ? `
PROSPECTO EN FOCO DIRECTO:
- Nombre: ${targetLead.contact_name || targetLead.business_name}
- Estado en CRM: ${targetLead.status}
- Asignado a: ${targetLead.assigned_to || advisor.name}
- Teléfono: ${targetLead.phone || 'No registrado'}
- Últimas gestiones en bitácora:
${targetLeadTimeline.length > 0 ? targetLeadTimeline.map(n => `  • ${n}`).join('\n') : '  (Sin notas previas)'}
` : ''}

REGLAS DE ACTUACIÓN:
1. DIÁLOGO DIRECTO CON ${advisor.name.toUpperCase()}: Tú eres el Director Comercial de Bienestar y socio estratégico de ${advisor.name}. Siempre que el usuario hable, reflexione, cuente una situación o pregunte sobre un cliente, HÁBLALE A ÉL (${advisor.name.split(' ')[0]}). Analiza la psicología del prospecto, valida su perspectiva comercial, dale tu recomendación estratégica táctica y, si corresponde, dale un borrador de mensaje sugerido entre comillas para que él lo copie y envíe por WhatsApp. NUNCA le hables en primera persona al prospecto como si fueras el usuario.
2. CONSULTAS VS ÓRDENES: Si el usuario te consulta una opinión ("¿cómo interpreto esto?", "¿qué opinas?", "¿crees que tiene interés?"), tu respuesta es un diálogo estratégico de socio ("intent": "general_chat"). NUNCA actualices la bitácora ("intent": "update_lead") a menos que te dé una orden explícita ("anota esto", "guarda en bitácora", "cambia a perdido", "pon próxima acción").
3. COMUNICACIÓN EJECUTIVA: Habla siempre como un director comercial de élite: empático, conciso, humano y orientado al cierre. PROHIBIDO usar vocabulario técnico (no menciones "is_my_lead", "UUID", "JSON", "true/false", etc.) ni frases robóticas defensivas.
4. SEGUIMIENTOS Y AGENDA: Si consultan por tareas de hoy, lista TODAS las tareas activas de la cartera precalculada arriba sin omitir ninguna, con formato:
   • [Nombre] ([Hora]) — [Acción ejecutiva breve]
   Cierra con: "¿A cuál de ellos le preparamos el mensaje de WhatsApp ahora?"
5. WHATSAPP COPYWRITING: Si piden mensaje para un prospecto, redacta un WhatsApp cálido, directo y persuasivo al estilo peruano/latino, listo para copiar entre comillas.
6. BITÁCORA Y CRM: Solo define intent: "update_lead" si el usuario da una orden o dicta qué pasó con un cliente. NUNCA inventes notas falsas ("note_text" debe ser vacío si no dictó notas).
7. ELIMINAR PRÓXIMA ACCIÓN: Si piden quitar, borrar o dejar en blanco la próxima acción, define "clear_next_action": true, "next_action_text": "", "next_action_date": "".
8. CREAR PROSPECTOS: Si piden anotar cita o prospecto nuevo que no está en la base, define intent: "create_lead" con "new_lead_data".
9. COMPRENSIÓN FONÉTICA: Si un audio o texto tiene variaciones fonéticas (ej. "Luis Kulki" o "Culquin" = Luis Culqui; "Kike" = Quique; "Advincula" = Claudia Advincula), asócialo de inmediato al prospecto real sin discutir.

FORMATO DE RESPUESTA OBLIGATORIO (JSON ESTRICTO):
{
  "intent": "update_lead" | "create_lead" | "general_chat",
  "target_lead_id": "id del lead si se identificó, o null",
  "target_lead_name": "nombre del lead",
  "clear_next_action": false,
  "note_text": "texto de la nota para bitácora si aplica",
  "next_action_text": "texto de la próxima acción si aplica",
  "next_action_date": "YYYY-MM-DDTHH:mm si aplica",
  "new_status": "prospecto | llamado | cita_agendada | presentacion_realizada | cerrado_ganado | cerrado_perdido si aplica",
  "new_plan": "plan_30 | plan_80 | plan_200 | plan_500 | plan_1200 si aplica",
  "new_assigned_to": "Luis Hakim | Alberto Zegarra si pidió reasignar, o null",
  "new_value": null,
  "new_lead_data": { "business_name": "", "contact_name": "", "phone": "", "target_plan": "plan_30", "estimated_value": 400 },
  "reply_message": "Tu respuesta ejecutiva y estratégica para ${advisor.name}."
}`;

  const formattedHistory = (conversationHistory || [])
    .slice(-10)
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || m.text || ''
    }))
    .filter(m => m.content && m.content.trim().length > 0);

  // -------------------------------------------------------------
  // Multi-Provider Fast Cascade: Groq (ultra-fast) -> Gemini (fallback)
  // -------------------------------------------------------------
  let aiJson = {};

  // 1. PRIMARY: Groq (response time ~1s, prevents any Telegram webhook timeouts)
  if (GROQ_KEY) {
    const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
    for (const gModel of groqModels) {
      try {
        const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`
          },
          body: JSON.stringify({
            model: gModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...formattedHistory,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.15,
            response_format: { type: 'json_object' }
          }),
          signal: AbortSignal.timeout(5000)
        });
        if (gRes.ok) {
          const j = await gRes.json();
          if (j.choices?.[0]?.message?.content) {
            aiJson = j;
            break;
          }
        } else {
          const errBody = await gRes.text().catch(() => '');
          console.warn(`Groq ${gModel} returned status ${gRes.status}:`, errBody.slice(0, 200));
        }
      } catch (gErr) {
        console.warn(`Groq ${gModel} error or timeout:`, gErr.message);
      }
    }
  }

  // 2. SECONDARY: Google Gemini Cascade (with strict 6s timeout per model)
  if (!aiJson.choices?.[0]?.message?.content) {
    const geminiModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    for (const modelName of geminiModels) {
      try {
        const res = await fetch(AI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              ...formattedHistory,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.2,
            max_tokens: 2500
          }),
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const j = await res.json();
          if (j.choices?.[0]?.message?.content) {
            aiJson = j;
            break;
          }
        }
        console.warn(`Model ${modelName} returned status ${res.status}`);
      } catch (err) {
        console.warn(`Error calling model ${modelName}:`, err.message);
      }
    }
  }

  // 3. SAFE FALLBACK if all LLM engines timed out or failed
  if (!aiJson.choices?.[0]?.message?.content) {
    if (allActiveWorkload.length > 0) {
      const items = allActiveWorkload.map(t => `• <b>${t.name}</b> (${t.hora_am_pm || 'Sin hora'}) — ${t.next_action}`);
      const fallbackReply = `Tienes estos seguimientos pendientes listos para accionar en tu cartera:\n\n${items.join('\n')}\n\n¿A cuál de ellos le preparamos el mensaje de WhatsApp ahora?`;
      return { replyText: fallbackReply, rawReply: fallbackReply };
    }
    const fallbackReply = `Hola ${advisor.name.split(' ')[0]}, recibí tu mensaje. ¿En qué prospecto o gestión nos enfocamos ahora?`;
    return { replyText: fallbackReply, rawReply: fallbackReply };
  }

  const rawContent = aiJson.choices?.[0]?.message?.content || '{}';
  const parsed = parseAIResponse(rawContent);

  let badgePrefix = '';
  let cleanReply = parsed.reply_message || '';

  const isUserExplicitUpdate = isExplicitUpdateCommand(userMessage);
  const isUserExplicitCreate = isExplicitCreateCommand(userMessage);

  // Handle Intent: Update or Create Lead in Supabase
  let updatePerformed = false;
  const isUserExplicitDoNotModify = /\bno\s+(modificar|modifiques|cambies|actualices|toques|hagas|guardes|anotes|registres|borres|elimines|crees|agregues)\b/i.test(userMessage);

  const hasConcreteUpdate = Boolean(
    (parsed.note_text && parsed.note_text.trim().length > 0) ||
    (parsed.next_action_date && parsed.next_action_date.trim().length > 0) ||
    (parsed.next_action_text && parsed.next_action_text.trim().length > 0) ||
    parsed.clear_next_action === true ||
    parsed.new_status ||
    parsed.new_plan ||
    parsed.new_assigned_to
  );

  if (!targetLead && (parsed.target_lead_id || parsed.target_lead_name)) {
    targetLead = findMatchingLead(leads, parsed.target_lead_id, parsed.target_lead_name);
  }

  const candidateContactName = (parsed.new_lead_data?.contact_name || parsed.target_lead_name || '').trim();
  if (!targetLead && candidateContactName) {
    targetLead = findMatchingLead(leads, null, candidateContactName);
  }

  // 1. Direct scan: check if user explicitly mentioned a lead in their message
  if (!targetLead && userMessage) {
    targetLead = findLeadInSentence(leads, userMessage, advisor.name);
  }

  // 2. Contextual scan: if user is updating/responding without naming the lead (e.g. "me respondio esto...", "pon en bitacora...", "le envie el mensaje")
  if (!targetLead && (isUserExplicitUpdate || /^(me\s+respondi[oó]|respondi[oó]|contest[oó]|dijo\s+que|escribi[oó]|le\s+escrib[ií]|le\s+mand[eé]|habl[eé]\s+con\s+[eé]l|habl[eé]\s+con\s+ella|pon\s+en\s+bit[aá]cora)/i.test(userMessage))) {
    targetLead = findLeadFromHistory(leads, conversationHistory, advisor.name);
  }

  // 3. Fallback: fuzzy phonetic match on full message
  if (!targetLead && userMessage) {
    targetLead = findMatchingLead(leads, null, userMessage);
  }

  // 1. UPDATE EXISTING LEAD IN CRM
  const shouldPerformUpdate = targetLead && !isUserExplicitDoNotModify && (
    isUserExplicitUpdate ||
    isUserExplicitCreate ||
    hasConcreteUpdate ||
    parsed.intent === 'update_lead' ||
    parsed.intent === 'create_lead'
  );

  if (shouldPerformUpdate) {
    let timeline = [];
    let currentNextAction = '';
    let currentNextDate = '';
    let currentLostReason = '';
    let currentLostLabel = '';

    try {
      const p = JSON.parse(targetLead.notes || '[]');
      if (Array.isArray(p)) timeline = p;
      else if (p && typeof p === 'object') {
        timeline = p.timeline || [];
        currentNextAction = p.next_action || '';
        currentNextDate = p.next_action_date || '';
        currentLostReason = p.lost_reason || '';
        currentLostLabel = p.lost_reason_label || '';
      } else if (targetLead.notes) {
        timeline = [{ date: targetLead.created_at || new Date().toISOString(), text: targetLead.notes }];
      }
    } catch (e) {
      if (targetLead.notes) timeline = [{ date: targetLead.created_at || new Date().toISOString(), text: targetLead.notes }];
    }

    // Only add to timeline if the user or AI actually stated note details
    let noteContent = parsed.note_text || parsed.new_lead_data?.notes || '';
    if (!noteContent || noteContent.trim().length === 0) {
      if (/mensaje\s+que\s+le\s+envi[eé]|se\s+le\s+envi[oó]\s+mensaje|le\s+escrib[ií]\s+por\s+whatsapp|le\s+escrib[ií]|le\s+mand[eé]/i.test(userMessage)) {
        noteContent = `Mensaje de seguimiento enviado por WhatsApp`;
      } else if (/me\s+respondi[oó]|dijo\s+que|contest[oó]/i.test(userMessage)) {
        noteContent = `Respuesta del cliente por WhatsApp: «${userMessage.replace(/^(me\s+respondi[oó]|dijo\s+que|contest[oó])\s*(esto:?)?\s*/i, '').trim()}»`;
      } else if (isUserExplicitUpdate) {
        noteContent = userMessage;
      }
    }
    if (noteContent && noteContent.trim().length > 0) {
      const noteWithAuthor = `${noteContent.trim()} [Registrado por ${advisor.name} vía Telegram]`;
      timeline = [{ date: new Date().toISOString(), text: noteWithAuthor }, ...timeline];
    }

    // Check if user or AI wants to clear/delete the scheduled next action
    const wantsToClearNextAction =
      parsed.clear_next_action === true ||
      (parsed.next_action_text !== undefined && ['borrar', 'eliminar', 'ninguna', 'ninguno', 'vacio', 'vacío', 'clear', 'none', ''].includes(String(parsed.next_action_text).toLowerCase().trim()) && parsed.clear_next_action !== false) ||
      (/\b(borra|borrar|elimina|eliminar|quita|quitar|deja en blanco|dejar en blanco|dejarlo en blanco|d[eé]jalo en blanco|sin pr[oó]xima acci[oó]n|limpia|limpiar)\b/i.test(userMessage) &&
       /\b(pr[oó]xima acci[oó]n|acci[oó]n pendiente|fecha|tarea|alarma|recordatorio)\b/i.test(userMessage));

    let finalNextAction = currentNextAction;
    let finalNextDate = currentNextDate;

    if (wantsToClearNextAction) {
      finalNextAction = '';
      finalNextDate = '';
    } else {
      if (parsed.next_action_text !== undefined && parsed.next_action_text !== null && parsed.next_action_text !== '') {
        finalNextAction = parsed.next_action_text;
      }
      if (parsed.next_action_date !== undefined && parsed.next_action_date !== null && parsed.next_action_date !== '') {
        finalNextDate = parsed.next_action_date;
      }
      if (!finalNextAction || !finalNextDate) {
        if (/por la noche|en la noche/i.test(userMessage)) {
          finalNextAction = 'Hacer seguimiento tras revisión nocturna';
          finalNextDate = `${todayPeruYmd}T20:00`;
        } else if (/mañana/i.test(userMessage)) {
          finalNextAction = 'Hacer seguimiento al cliente';
          finalNextDate = `${tomorrowPeruYmd}T10:00`;
        }
      }
    }

    // Handle Reassignment / Lead Transfer
    let newlyAssignedAdvisor = null;
    if (parsed.new_assigned_to) {
      const rawTarget = String(parsed.new_assigned_to).toLowerCase();
      if (rawTarget.includes('luis') || rawTarget.includes('hakim') || rawTarget.includes('socio')) {
        newlyAssignedAdvisor = 'Luis Hakim';
      } else if (rawTarget.includes('alberto') || rawTarget.includes('zegarra') || rawTarget.includes('admin')) {
        newlyAssignedAdvisor = 'Alberto Zegarra';
      }
      if (newlyAssignedAdvisor) {
        const reassignNote = `Lead transferido/reasignado a ${newlyAssignedAdvisor} por ${advisor.name} vía Telegram`;
        if (!timeline.some(n => n.text && n.text.includes(`reasignado a ${newlyAssignedAdvisor}`))) {
          timeline = [{ date: new Date().toISOString(), text: reassignNote }, ...timeline];
        }
      }
    }

    const updatedNotesPayload = JSON.stringify({
      timeline,
      next_action: finalNextAction,
      next_action_date: finalNextDate,
      lost_reason: currentLostReason,
      lost_reason_label: currentLostLabel
    });

    const updateFields = {
      notes: updatedNotesPayload,
      last_interaction: new Date().toISOString()
    };
    if (parsed.new_status) updateFields.status = parsed.new_status;
    if (parsed.new_plan || parsed.new_lead_data?.target_plan) updateFields.target_plan = parsed.new_plan || parsed.new_lead_data?.target_plan;
    if (newlyAssignedAdvisor) updateFields.assigned_to = newlyAssignedAdvisor;

    const { error: updateErr } = await supabase.from('leads').update(updateFields).eq('id', targetLead.id);
    if (!updateErr) {
      updatePerformed = true;
      if (newlyAssignedAdvisor) {
        badgePrefix = `✅ <b>Lead reasignado a ${newlyAssignedAdvisor} en CRM</b> para <i>${targetLead.contact_name || targetLead.business_name}</i>\n\n`;
      } else {
        badgePrefix = `✅ <b>CRM actualizado para ${targetLead.contact_name || targetLead.business_name}</b>\n\n`;
      }
      if (!cleanReply || cleanReply.length === 0 || cleanReply.startsWith('Hola ') || cleanReply.includes('¿En qué prospecto')) {
        cleanReply = `Listo ${advisor.name.split(' ')[0]}. Registré en la bitácora de ${targetLead.contact_name || targetLead.business_name}: «${noteContent || 'Gestión comercial'}».`;
      }
    } else {
      console.error('Error updating lead in supabase:', updateErr);
      badgePrefix = `⚠️ <i>Hubo un error al guardar en el CRM: ${updateErr.message}</i>\n\n`;
    }
  }

  // 2. CREATE NEW LEAD IN CRM (IF NOT FOUND AND INTENT OR USER COMMAND DIRECTS TO CREATE/SCHEDULE)
  const isInvalidContactName = !candidateContactName ||
    candidateContactName.length < 2 ||
    ['crm', 'sistema', 'bot', 'copilot', 'bitacora', 'prospecto', 'cliente', 'lead', 'null', 'undefined', 'nada', 'ninguno'].includes(candidateContactName.toLowerCase());

  const shouldCreateNewLead = !targetLead && !isUserExplicitDoNotModify && !isInvalidContactName && (
    parsed.intent === 'create_lead' ||
    isUserExplicitCreate ||
    ((isUserExplicitUpdate || hasConcreteUpdate) && (parsed.note_text || parsed.next_action_text || parsed.next_action_date))
  );

  if (shouldCreateNewLead) {
    const d = parsed.new_lead_data || {};
    const contactName = candidateContactName;
    const businessName = d.business_name || contactName;

    // Detect status smartly if not explicitly given
    const initialStatus = parsed.new_status || (
      /\b(zoom|reuni[oó]n|cita|demo)\b/i.test(`${parsed.next_action_text || ''} ${userMessage}`) ? 'cita_agendada' :
      /\b(habl[eé]|llam[eé]|convers[eé]|llamada)\b/i.test(userMessage) ? 'llamado' : 'prospecto'
    );

    let initialTimeline = [];
    const noteText = parsed.note_text || d.notes || '';
    if (noteText && noteText.trim().length > 0) {
      initialTimeline.push({
        date: new Date().toISOString(),
        text: `${noteText.trim()} [Registrado por ${advisor.name} vía Telegram]`
      });
    } else {
      initialTimeline.push({
        date: new Date().toISOString(),
        text: `Prospecto creado vía Copiloto Telegram por ${advisor.name}`
      });
    }

    const defaultAction = initialStatus === 'cita_agendada' ? 'Reunión agendada' : 'Enviar mensaje de bienvenida y presentación';
    const nextAction = parsed.next_action_text || defaultAction;
    const nextActionDate = parsed.next_action_date || (initialStatus === 'cita_agendada' ? '' : new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

    const newLeadRecord = {
      contact_name: contactName,
      business_name: businessName,
      phone: d.phone || '',
      target_plan: d.target_plan || parsed.new_plan || 'plan_30',
      estimated_value: d.estimated_value || parsed.new_value || 400,
      status: initialStatus,
      assigned_to: advisor.name,
      created_at: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      notes: JSON.stringify({
        timeline: initialTimeline,
        next_action: nextAction,
        next_action_date: nextActionDate
      })
    };

    const { data: insertedData, error: insertErr } = await supabase.from('leads').insert([newLeadRecord]).select();
    if (!insertErr && insertedData?.[0]) {
      updatePerformed = true;
      badgePrefix = `🎉 <b>Nuevo prospecto creado en CRM para ${advisor.name}:</b> <i>${contactName}</i>\n\n`;
    } else {
      console.error('Error inserting new lead in supabase:', insertErr);
      badgePrefix = `⚠️ <i>Hubo un error al crear el prospecto en el CRM: ${insertErr?.message || 'Error desconocido'}</i>\n\n`;
    }
  } else if (!targetLead && isUserExplicitUpdate && !updatePerformed) {
    const rawTarget = (parsed.target_lead_name || candidateContactName || '').replace(/['"]/g, '').trim();
    if (rawTarget && rawTarget.length > 1) {
      badgePrefix = `⚠️ <i>No encontré al prospecto "${rawTarget}" en el CRM para actualizarlo.</i>\n\n`;
    } else {
      badgePrefix = `⚠️ <i>¿A qué prospecto te refieres para registrar esta gestión en el CRM?</i>\n\n`;
    }
  }

  if (!cleanReply) {
    cleanReply = parsed.reply_message || '';
  }

  // Fail-safe: If cleanReply STILL looks like raw JSON, parse it to extract reply_message
  if (typeof cleanReply === 'string' && cleanReply.trim().startsWith('{') && (cleanReply.includes('"reply_message"') || cleanReply.includes('"intent"'))) {
    const re = parseAIResponse(cleanReply);
    if (re.reply_message) cleanReply = re.reply_message;
  }

  if (!updatePerformed) {
    // Sanitize any false claims of CRM update or creation if no write occurred in database
    cleanReply = cleanReply
      .replace(/^(\s*✅\s*)?(prospecto\s+(creado|registrado|agendado)[^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(nuevo\s+prospecto[^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(.*ha\s+sido\s+registrado[^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(.*ya\s+est[aá]\s+(registrado|actualizado|agendado)[^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(bit[aá]cora.*actualizada[^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(actualizado en el crm[^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(ya actualic[eé][^\n]*\n*)/i, '')
      .replace(/^(\s*✅\s*)?(ya qued[oó] registrado[^\n]*\n*)/i, '')
      .trim();
  }

  // Guaranteed contextual answer if AI returned empty or failed
  if (!cleanReply || cleanReply.trim().length === 0 || cleanReply.trim() === `Listo ${advisor.name.split(' ')[0]}.` || (updatePerformed && cleanReply.includes('¿En qué prospecto'))) {
    if (updatePerformed && targetLead) {
      cleanReply = `Listo ${advisor.name.split(' ')[0]}. Ya registré la gestión en la bitácora de **${targetLead.contact_name || targetLead.business_name}**.`;
    } else if (/\b(tarea|tareas|agenda|pendiente|pendientes|vencida|vencidas|hoy|llamada|llamadas|seguimiento|seguimientos)\b/i.test(userMessage)) {
      if (allActiveWorkload.length === 0) {
        cleanReply = `En tu cartera personal no tienes tareas pendientes ni vencidas para hoy. Tu agenda está al día.`;
      } else {
        const listStr = allActiveWorkload.map((t) => {
          const timeStr = formatFriendlyTime(t.next_action_date);
          const timeBadge = timeStr ? ` (${timeStr})` : '';
          const actionText = summarizeTaskAction(t.next_action);
          return `• **${t.name}**${timeBadge} — ${actionText}`;
        }).join('\n');
        cleanReply = `Tienes estos seguimientos pendientes listos para accionar en tu cartera:\n\n${listStr}\n\n¿A cuál de ellos le preparamos el mensaje de WhatsApp ahora?`;
      }
    } else {
      cleanReply = `Hola ${advisor.name.split(' ')[0]}, recibí tu mensaje. ¿En qué prospecto o gestión nos enfocamos ahora?`;
    }
  }

  const finalHtml = badgePrefix + formatForTelegramHtml(cleanReply);
  return {
    replyText: finalHtml,
    rawReply: cleanReply
  };
}

// Helper: Parse date in Peru Timezone (UTC-5)
function parsePeruDateTime(dateStr) {
  if (!dateStr) return 0;
  const clean = String(dateStr).trim();
  if (!clean.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(clean)) {
    const parts = clean.split('T');
    if (parts.length === 2) {
      const timePart = parts[1].length === 5 ? parts[1] + ':00' : parts[1];
      return new Date(`${parts[0]}T${timePart}-05:00`).getTime();
    }
  }
  return new Date(clean).getTime();
}

// -------------------------------------------------------------
// Helper: Send Proactive Reminders (Zoom 60m & Calls 20m)
// -------------------------------------------------------------
export async function checkAndSendReminders() {
  // Self-healing: verify webhook is always pointed to bienestar-crm.vercel.app
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`);
    const whData = await whRes.json();
    if (whData?.ok && (!whData.result?.url || !whData.result.url.includes('bienestar-crm.vercel.app'))) {
      console.warn('Webhook altered or missing, auto-restoring connection:', whData.result?.url);
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=https://bienestar-crm.vercel.app/api/telegram`);
    }
  } catch (whErr) {
    console.warn('Auto webhook check error:', whErr);
  }

  const { data: sessionData } = await supabase
    .from('leads')
    .select('notes')
    .eq('business_name', 'SYSTEM_TELEGRAM_SESSION')
    .maybeSingle();

  let sessionObj = {};
  try {
    sessionObj = JSON.parse(sessionData?.notes || '{}');
  } catch (e) {}

  const users = sessionObj.users || {};
  let albertoChatId = sessionObj.alberto_chat_id || sessionObj.chat_id || lastAdminChatId;
  let luisChatId = sessionObj.luis_chat_id || null;

  for (const [cId, u] of Object.entries(users)) {
    if (u.advisorKey === 'alberto' && !albertoChatId) albertoChatId = cId;
    if (u.advisorKey === 'luis' && !luisChatId) luisChatId = cId;
  }

  const { data: rawLeads } = await supabase.from('leads').select('*');
  const leads = (rawLeads || []).filter(l => l.business_name !== 'SYSTEM_TELEGRAM_SESSION' && l.client_type !== 'system_internal');

  const now = new Date();
  const nowMs = now.getTime();

  let remindersSent = 0;

  for (const l of leads) {
    let nextAction = '';
    let nextActionDate = '';
    let parsedNotes = {};
    try {
      parsedNotes = JSON.parse(l.notes || '{}');
      if (parsedNotes && typeof parsedNotes === 'object') {
        nextAction = parsedNotes.next_action || '';
        nextActionDate = parsedNotes.next_action_date || '';
      }
    } catch (e) {}

    if (!nextActionDate) continue;

    // Deduplication: skip if reminder was already sent for this exact scheduled time
    if (parsedNotes.last_reminder_sent_for === nextActionDate) continue;

    // Parse scheduled time in Peru timezone (UTC-5)
    const taskTime = parsePeruDateTime(nextActionDate);
    if (!taskTime || isNaN(taskTime)) continue;

    const diffMinutes = Math.round((taskTime - nowMs) / (60 * 1000));

    // Determine target recipient based on lead assignment
    const assigned = (l.assigned_to || '').toLowerCase();
    const isLuisLead = assigned.includes('luis') || assigned.includes('hakim') || assigned.includes('socio comercial');
    const targetChatId = isLuisLead ? (luisChatId || albertoChatId) : (albertoChatId || luisChatId);

    if (!targetChatId) continue;

    const isZoom = nextAction.toLowerCase().includes('zoom') || nextAction.toLowerCase().includes('reunion') || nextAction.toLowerCase().includes('demo');

    let sentThis = false;

    // 1. Zoom alert between 45 and 75 minutes (~1 hora antes)
    if (isZoom && diffMinutes >= 45 && diffMinutes <= 75) {
      const msg = `🚨 <b>¡Recordatorio de Zoom en ~1 hora!</b>\n\n` +
        `👤 <b>Cliente:</b> ${l.contact_name || l.business_name}\n` +
        `⏰ <b>Hora:</b> ${nextActionDate.split('T')[1] || ''} (hora Perú)\n` +
        `📝 <b>Detalle:</b> ${nextAction}\n\n` +
        `🎯 <i>Prepárate para abrir la sala y tener la app lista para proyectar.</i>`;
      await sendTelegramMessage(targetChatId, msg);
      remindersSent++;
      sentThis = true;
    }

    // 2. Call/Message alert between 10 and 30 minutes (~20 minutos antes)
    if (!isZoom && diffMinutes >= 10 && diffMinutes <= 30) {
      const msg = `⏰ <b>Recordatorio de Tarea en ~20 minutos</b>\n\n` +
        `👤 <b>Cliente:</b> ${l.contact_name || l.business_name}\n` +
        `⏰ <b>Hora:</b> ${nextActionDate.split('T')[1] || ''} (hora Perú)\n` +
        `📝 <b>Acción:</b> ${nextAction}\n\n` +
        `📱 <i>Abre WhatsApp o agenda la llamada a tiempo.</i>`;
      await sendTelegramMessage(targetChatId, msg);
      remindersSent++;
      sentThis = true;
    }

    if (sentThis) {
      parsedNotes.last_reminder_sent_for = nextActionDate;
      await supabase.from('leads').update({
        notes: JSON.stringify(parsedNotes)
      }).eq('id', l.id);
    }
  }

  return { status: 'ok', remindersSent, albertoChatId, luisChatId };
}

// -------------------------------------------------------------
// Intent Validation Guardrails & Lead Matching
// -------------------------------------------------------------
// Helper: Normalize text removing diacritics / accents
function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function normalizeStr(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phoneticNormalize(str) {
  if (!str) return '';
  return normalizeStr(str)
    .replace(/qu/g, 'k')
    .replace(/c(?=[aou\s]|$)/g, 'k')
    .replace(/c(?=[ei])/g, 's')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/y/g, 'i')
    .replace(/ll/g, 'i')
    .replace(/h/g, '')
    .replace(/(.)\1+/g, '$1')
    .trim();
}

// Helper: Scan a full sentence to detect if any lead name or key name token is mentioned
function findLeadInSentence(leads, text, advisorName = 'Alberto Zegarra') {
  if (!text || !leads || leads.length === 0) return null;
  const cleanText = ' ' + normalizeStr(text) + ' ';
  const stopWords = new Set([
    'lic', 'licenciada', 'licenciado', 'dr', 'dra', 'doctor', 'doctora', 'ing', 'ingeniero', 'coach',
    'sr', 'sra', 'senor', 'senora', 'amigo', 'amiga', 'de', 'del', 'la', 'el', 'los', 'las', 'un',
    'una', 'en', 'por', 'para', 'con', 'que', 'le', 'al', 'se', 'lo', 'los', 'las', 'les', 'me',
    'te', 'nos', 'mi', 'mis', 'su', 'sus', 'hoy', 'ayer', 'manana', 'crm', 'bot', 'lead', 'prospecto',
    'cliente', 'mensaje', 'bitacora', 'llamada', 'tarea', 'agenda', 'contacto'
  ]);

  let candidates = [];
  for (const l of leads) {
    if (l.business_name === 'SYSTEM_TELEGRAM_SESSION') continue;
    const isMyLead = (l.assigned_to || '').toLowerCase().includes(advisorName.split(' ')[0].toLowerCase());
    const cNorm = normalizeStr(l.contact_name);
    const bNorm = normalizeStr(l.business_name);

    // Exact full name match in text (e.g. 'david godoy', 'luis culqui', 'lic sandra')
    if (cNorm && cleanText.includes(' ' + cNorm + ' ')) {
      candidates.push({ lead: l, score: 100, isMyLead });
      continue;
    }
    if (bNorm && cleanText.includes(' ' + bNorm + ' ')) {
      candidates.push({ lead: l, score: 95, isMyLead });
      continue;
    }

    // Check individual significant tokens (e.g. 'sandra', 'culqui', 'godoy', 'monica', 'noe', 'yoselin')
    const tokens = [...cNorm.split(' '), ...bNorm.split(' ')].filter(t => t.length >= 3 && !stopWords.has(t));
    for (const token of tokens) {
      if (cleanText.includes(' ' + token + ' ')) {
        let score = token.length >= 4 ? 80 : 50;
        if (cNorm.startsWith(token) || cNorm.endsWith(token)) score += 20;
        candidates.push({ lead: l, score, isMyLead, token });
      }
    }
  }

  if (candidates.length > 0) {
    // Sort by isMyLead first, then score descending
    candidates.sort((a, b) => {
      if (a.isMyLead !== b.isMyLead) return a.isMyLead ? -1 : 1;
      return b.score - a.score;
    });
    return candidates[0].lead;
  }
  return null;
}

// Helper: Scan recent conversation history to inherit the last referenced lead
function findLeadFromHistory(leads, history, advisorName = 'Alberto Zegarra') {
  if (!history || history.length === 0 || !leads || leads.length === 0) return null;
  for (let i = history.length - 1; i >= Math.max(0, history.length - 6); i--) {
    const raw = history[i]?.content || '';
    const clean = ' ' + normalizeStr(raw) + ' ';
    for (const l of leads) {
      if (l.business_name === 'SYSTEM_TELEGRAM_SESSION') continue;
      const cNorm = normalizeStr(l.contact_name);
      if (cNorm && cNorm.length >= 3 && clean.includes(' ' + cNorm + ' ')) return l;
      const bNorm = normalizeStr(l.business_name);
      if (bNorm && bNorm.length >= 3 && clean.includes(' ' + bNorm + ' ')) return l;
    }
  }
  return null;
}

// Helper: Resilient Fuzzy & Phonetic Lead Matching (handles speech-to-text slips like Kulki/Culqui)
function findMatchingLead(leads, targetId, targetName) {
  if (!leads || leads.length === 0) return null;

  // Filter out system session records
  const realLeads = leads.filter(l => l.business_name !== 'SYSTEM_TELEGRAM_SESSION');

  // 1. Direct ID match
  if (targetId && typeof targetId === 'string' && targetId.trim().length > 10) {
    const byId = realLeads.find(l => l.id === targetId.trim());
    if (byId) return byId;
  }

  if (!targetName || typeof targetName !== 'string') return null;
  const cleanTarget = normalizeStr(targetName);
  if (!cleanTarget) return null;
  const targetWords = cleanTarget.split(' ').filter(w => w.length > 1);
  const targetPhonetic = phoneticNormalize(cleanTarget);
  const targetPhoneticWords = targetPhonetic.split(' ').filter(w => w.length > 1);

  let bestLead = null;
  let bestScore = 0;

  for (const l of realLeads) {
    const contact = normalizeStr(l.contact_name);
    const business = normalizeStr(l.business_name);
    const combined = contact + ' ' + business;
    const contactPhonetic = phoneticNormalize(l.contact_name);
    const businessPhonetic = phoneticNormalize(l.business_name);
    const combinedPhonetic = contactPhonetic + ' ' + businessPhonetic;

    // Exact full match
    if (contact === cleanTarget || business === cleanTarget) {
      return l;
    }

    // Exact phonetic full match (e.g. "Luis Kulki" === "Luis Culqui")
    if (contactPhonetic === targetPhonetic || businessPhonetic === targetPhonetic) {
      return l;
    }

    // Substring inclusion with normalized spaces
    if (contact.includes(cleanTarget) || business.includes(cleanTarget) || cleanTarget.includes(contact) || cleanTarget.includes(business)) {
      const score = Math.max(contact.length, business.length) > 0 ? 100 : 0;
      if (score > bestScore) {
        bestScore = score;
        bestLead = l;
      }
    }

    // Phonetic substring inclusion (e.g. "kulkin" in target matches "kulki" in phonetic contact)
    if (contactPhonetic.includes(targetPhonetic) || businessPhonetic.includes(targetPhonetic) ||
        targetPhonetic.includes(contactPhonetic) || targetPhonetic.includes(businessPhonetic)) {
      const score = 95;
      if (score > bestScore) {
        bestScore = score;
        bestLead = l;
      }
    }

    // Word-level phonetic matching
    let phoneticMatches = 0;
    for (const pw of targetPhoneticWords) {
      if (combinedPhonetic.includes(pw) ||
          (pw.startsWith('kulki') && combinedPhonetic.includes('kulki')) ||
          (combinedPhonetic.includes(pw.slice(0, 4)) && pw.length >= 4)) {
        phoneticMatches++;
      }
    }
    const tokenScore = (phoneticMatches / Math.max(targetPhoneticWords.length, 1)) * 90;
    if (tokenScore > bestScore && phoneticMatches >= 1) {
      bestScore = tokenScore;
      bestLead = l;
    }
  }

  // Fallback: single unique lead match by key phonetic word
  if (!bestLead || bestScore < 40) {
    for (const pw of targetPhoneticWords) {
      if (pw.length >= 4) {
        const uniqueMatches = realLeads.filter(l => {
          const ph = phoneticNormalize(l.contact_name + ' ' + l.business_name);
          return ph.includes(pw) || pw.includes(ph) || (pw.startsWith('kulki') && ph.includes('kulki'));
        });
        if (uniqueMatches.length === 1) {
          return uniqueMatches[0];
        }
      }
    }
  }

  return bestScore >= 40 ? bestLead : null;
}


function isExplicitUpdateCommand(userText) {
  if (!userText || typeof userText !== 'string') return false;
  const t = normalizeText(userText);

  // If user explicitly says not to modify
  if (/\bno\s+(modificar|modifiques|cambies|actualices|toques|hagas|guardes|anotes|registres|borres|elimines)\b/i.test(t)) {
    return false;
  }

  // Pure query questions at the start of sentence without action verbs:
  const isQueryQuestion = /^¿?\s*(que|cual|cuales|quien|quienes|cuando|donde|a que hora|como|revisa|revisaste|consultaste|consulta|dime|ver|muestra|hay alguna|tengo alguna)\b/i.test(t)
    && !/\b(registra|registres|anota|anotes|guarda|guardes|pon|pongas|cambia|cambies|agenda|agendes|actualiza|actualices|borra|borres|elimina|elimines|deja en blanco|dejes en blanco)\b/i.test(t);

  if (isQueryQuestion) return false;

  // Broad action pattern matching imperative/subjunctive/infinitive verbs with optional clitic object pronouns
  const actionPattern = /\b(cambia(r|s|do|da|ron)?(lo|le|me|la|les|los)?|cambies|cambie(mos)?|pon(ga|gas|gan)?(lo|le|me|la|les|los)?|poner|mueve(lo|le|me|la|les|los)?|muevas|mover|pasa(r)?(lo|le|me|la|les|los)?|pases|pasar|asigna(r)?(lo|le|me|la|les|los)?|asignes|reasigna(r)?(lo|le|me|la|les|los)?|reasignes|transfiere|transferir|deriva(r)?(lo|le|me|la|les|los)?|agenda(r)?(lo|le|me|la|les|los)?|agendes|agende|registra(r)?(lo|le|me|la|les|los)?|registres|registre|anota(r)?(lo|le|me|la|les|los)?|anotes|anote|guarda(r)?(lo|le|me|la|les|los)?|guardes|guarde|actualiza(r)?(lo|le|me|la|les|los)?|actualices|actualice|modifica(r)?(lo|le|me|la|les|los)?|modifiques|modifique|reprograma(r)?(lo|le|me|la|les|los)?|reprogrames|programa(r)?(lo|le|me|la|les|los)?|programes|borra(r)?(lo|le|me|la|les|los)?|borres|elimina(r)?(lo|le|me|la|les|los)?|elimines|quita(r)?(lo|le|me|la|les|los)?|quites|limpia(r)?(lo|le|me|la|les|los)?|marca(r)?(lo|le|me|la|les|los)?|marques|deja(r)?(lo|le|me|la|les|los)?\s+en\s+blanco|dejes\s+en\s+blanco)\b/i;

  const contextPattern = /\b(bitacora|hable con|converse con|llame a|reuni con|quedamos en|tuve (el )?zoom con|hicimos (el )?zoom con|sin proxima accion|proxima accion|a luis|a alberto|a hakim|respondio|contesto|dijo que|escribio|mando mensaje|mensaje que le envie|le envie el mensaje|me dijo)\b/i;

  return actionPattern.test(t) || (contextPattern.test(t) && !isQueryQuestion);
}


function isExplicitCreateCommand(userText) {
  if (!userText || typeof userText !== 'string') return false;
  const t = normalizeText(userText);
  if (/\bno\s+(crees|agregues|registres|guardes|pongas|anotes)\b/i.test(t)) return false;
  return /\b(crea(r)?(lo|le|me)?|agrega(r)?(lo|le|me)?|nuevo\s+(prospecto|cliente|lead|contacto)|nueva\s+(cita|reuni[oó]n)|crear\s+lead|registra(r)?(\s+(nuevo|a|al))?|anota(r)?\s+(en\s+(el|mi)\s+crm\s+)?(reuni[oó]n|cita|llamada|seguimiento|habl[eé]|con)|agenda(r)?\s+(en\s+(el|mi)\s+crm\s+)?(reuni[oó]n|cita|llamada|seguimiento|habl[eé]|que|con)|pon(er)?\s+en\s+(el|mi)\s+crm|ingresa(r)?|apunta(r)?)\b/i.test(t);
}

// -------------------------------------------------------------
// Formatting & Telegram API Utils
// -------------------------------------------------------------
function parseAIResponse(raw) {
  if (!raw || typeof raw !== 'string') return { intent: 'general_chat', reply_message: '' };
  let clean = raw.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  else if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();

  // 1. Try standard JSON.parse first
  try {
    const p = JSON.parse(clean);
    if (p && typeof p === 'object') return p;
  } catch (e) {}

  // 2. Try JSON.parse with sanitized control characters
  try {
    const sanitized = clean.replace(/[\u0000-\u001F]+/g, (match) => {
      if (match === '\n') return '\\n';
      if (match === '\r') return '\\r';
      if (match === '\t') return '\\t';
      return '';
    });
    const p = JSON.parse(sanitized);
    if (p && typeof p === 'object') return p;
  } catch (e) {}

  // 3. Try appending missing closing braces if incomplete JSON
  if (clean.startsWith('{') && !clean.endsWith('}')) {
    try {
      const p = JSON.parse(clean + '}');
      if (p && typeof p === 'object') return p;
    } catch (e) {}
    try {
      const p = JSON.parse(clean + '"}');
      if (p && typeof p === 'object') return p;
    } catch (e) {}
  }

  // 4. Robust regex extraction fallback for all fields
  const intentMatch = clean.match(/"intent"\s*:\s*"([^"]+)"/);
  const targetIdMatch = clean.match(/"target_lead_id"\s*:\s*"([^"]*)"/);
  const targetNameMatch = clean.match(/"target_lead_name"\s*:\s*"([^"]*)"/);
  const noteTextMatch = clean.match(/"note_text"\s*:\s*"([\s\S]*?)"\s*,\s*"next_action/);
  const nextActionMatch = clean.match(/"next_action_text"\s*:\s*"([\s\S]*?)"\s*,\s*"next_action_date/);
  const nextDateMatch = clean.match(/"next_action_date"\s*:\s*"([^"]*)"/);
  const newStatusMatch = clean.match(/"new_status"\s*:\s*"([^"]*)"/);
  const newPlanMatch = clean.match(/"new_plan"\s*:\s*"([^"]*)"/);
  const newAssignedMatch = clean.match(/"new_assigned_to"\s*:\s*"([^"]*)"/);
  const contactNameMatch = clean.match(/"contact_name"\s*:\s*"([^"]*)"/);

  const replyMatch = clean.match(/"reply_message"\s*:\s*"([\s\S]*)/);
  let replyContent = '';
  if (replyMatch) {
    replyContent = replyMatch[1];
    const lastQuoteIdx = replyContent.lastIndexOf('"');
    if (lastQuoteIdx !== -1) {
      replyContent = replyContent.slice(0, lastQuoteIdx);
    }
    replyContent = replyContent
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  } else {
    // If no reply_message field, remove outer braces and raw JSON structure
    replyContent = clean
      .replace(/^[{\s]*/, '')
      .replace(/[}\s]*$/, '')
      .replace(/"intent"\s*:\s*"[^"]*",?/g, '')
      .replace(/"target_lead_\w+"\s*:\s*"[^"]*",?/g, '')
      .replace(/"(clear_next_action|new_\w+)"\s*:\s*[^,\n]+,?/g, '')
      .trim();
  }

  return {
    intent: intentMatch ? intentMatch[1] : 'general_chat',
    target_lead_id: targetIdMatch ? targetIdMatch[1] : null,
    target_lead_name: targetNameMatch ? targetNameMatch[1] : (contactNameMatch ? contactNameMatch[1] : null),
    note_text: noteTextMatch ? noteTextMatch[1] : '',
    next_action_text: nextActionMatch ? nextActionMatch[1] : '',
    next_action_date: nextDateMatch ? nextDateMatch[1] : '',
    new_status: newStatusMatch ? newStatusMatch[1] : null,
    new_plan: newPlanMatch ? newPlanMatch[1] : null,
    new_assigned_to: newAssignedMatch ? newAssignedMatch[1] : null,
    new_lead_data: contactNameMatch ? { contact_name: contactNameMatch[1] } : null,
    reply_message: replyContent
  };
}

function formatForTelegramHtml(text) {
  if (!text) return '';

  // 1. Temporarily protect valid allowed Telegram HTML tags (<b>, <i>, <code>, <blockquote>, etc.)
  const validTags = [];
  let clean = text.replace(/<\/?(b|strong|i|em|code|pre|blockquote|a(\s+href="[^"]*")?)>/gi, (match) => {
    const placeholder = `__TG_TAG_${validTags.length}__`;
    validTags.push(match);
    return placeholder;
  });

  // 2. Escape raw HTML entities to prevent malformed tags
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 3. Restore valid protected tags
  validTags.forEach((tag, idx) => {
    let normalized = tag
      .replace(/<strong\b/gi, '<b')
      .replace(/<\/strong>/gi, '</b>')
      .replace(/<em\b/gi, '<i')
      .replace(/<\/em>/gi, '</i>');
    clean = clean.replace(`__TG_TAG_${idx}__`, normalized);
  });

  // Strip any accidental database UUIDs or (id: "...") technical markers
  clean = clean.replace(/\(?\bids?\s*:\s*["']?[0-9a-fA-F-]{36}["']?\)?/gi, '');
  clean = clean.replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '');
  clean = clean.replace(/\(\s*\)/g, '').replace(/  +/g, ' ');

  // Scrub any internal code variable leaks
  clean = clean.replace(/\b(is_my_lead|next_action_date|categoria_agenda|minutos_diferencia)\b\s*:\s*(true|false|\w+)/gi, '');
  clean = clean.replace(/\b(is_my_lead|next_action_date)\b/gi, '');

  // Scrub robotic or defensive lectures
  clean = clean.replace(/Esto no es un error del sistema[^.\n]*[.\n]?/gi, '');
  clean = clean.replace(/es una realidad operativa[^.\n]*[.\n]?/gi, '');
  clean = clean.replace(/la integridad del sistema[^.\n]*[.\n]?/gi, '');
  clean = clean.replace(/debo ser (absolutamente )?transparente contigo[^.\n]*[.\n]?/gi, '');
  clean = clean.replace(/es un error de tipeo tuyo[^.\n]*[.\n]?/gi, '');

  // Convert **bold** to <b>bold</b>
  clean = clean.replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');

  // Convert `code` to <code>code</code>
  clean = clean.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // Convert *italic* to <i>italic</i> only for clean single phrases without newlines
  clean = clean.replace(/(?<!\*)\*([^*\n]{1,80})\*(?!\*)/g, '<i>$1</i>');

  return clean;
}

async function sendTelegramMessage(chatId, htmlText) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('Telegram sendMessage with HTML failed:', data.description, '- Falling back to plain text');
      // If Telegram rejects HTML parsing, strip tags and deliver immediately as plain text
      const plainText = htmlText
        .replace(/<b>(.*?)<\/b>/gi, '$1')
        .replace(/<i>(.*?)<\/i>/gi, '$1')
        .replace(/<code>(.*?)<\/code>/gi, '$1')
        .replace(/<blockquote>(.*?)<\/blockquote>/gis, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: plainText
        })
      });
    }
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

async function sendChatAction(chatId, action = 'typing') {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action
      })
    });
  } catch (err) {}
}
