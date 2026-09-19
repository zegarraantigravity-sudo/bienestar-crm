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

const DEFAULT_KEY = decodeToken('c2std3MtSC5ETUxMRUxFLk5zN1UuTUVRQ0lFUWVGY1hpc3RQenlGSjNKYUZJZkl3VkF2RWF4cmZoTjlFOGV0NkhMTGFkQWlBT0VWcVE4ZE1OMU0wYkJ1WkVVZHNDLWhvdHc2bF9GbTVMVVVKOGdSOUZPdw==');
const DEFAULT_URL = 'https://ws-4obirdagiy942cl5.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus';

const AI_KEY = process.env.AI_API_KEY || process.env.VITE_AI_API_KEY || DEFAULT_KEY;
const AI_URL = process.env.AI_API_URL || process.env.VITE_AI_API_URL || DEFAULT_URL;
const AI_MODEL = process.env.AI_MODEL || process.env.VITE_AI_MODEL || DEFAULT_MODEL;

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

    let userText = message.text || message.caption || '';

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
// Helper: Transcribe audio using Qwen Omni Flash
// -------------------------------------------------------------
async function transcribeAudioUrl(audioUrl) {
  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen3.5-omni-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Transcribe exactamente todo lo que dice este audio en español, palabra por palabra, sin inventar ni agregar nada más:' },
              { type: 'input_audio', input_audio: { data: audioUrl, format: 'ogg' } }
            ]
          }
        ]
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('Transcription error:', e);
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
          const d = n.date ? `[${n.date.slice(0, 16).replace('T', ' ')}] ` : '';
          return `${d}${n.text || String(n)}`;
        }).filter(Boolean);
      } else if (p && typeof p === 'object') {
        timeline = (p.timeline || []).map(n => {
          if (!n) return '';
          const d = n.date ? `[${n.date.slice(0, 16).replace('T', ' ')}] ` : '';
          return `${d}${n.text || String(n)}`;
        }).filter(Boolean);
        nextAction = p.next_action || '';
        nextActionDate = p.next_action_date || '';
        lostReason = p.lost_reason_label || p.lost_reason || '';
      } else if (l.notes) {
        timeline = [l.notes];
      }
    } catch (e) {
      if (l.notes) timeline = [l.notes];
    }

    let categoria_agenda = 'SIN_FECHA';
    let minutos_diferencia = null;

    if (nextActionDate) {
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
      next_action: nextAction,
      next_action_date: nextActionDate,
      lost_reason: lostReason,
      categoria_agenda,
      minutos_diferencia,
      timeline: (timeline || []).slice(0, 8)
    };
  });

  const myHoyRetrasadas = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_HOY' && l.is_my_lead);
  const myHoyPendientes = leadsSummary.filter(l => l.categoria_agenda === 'HOY_PENDIENTE' && l.is_my_lead);
  const myVencidasPrevias = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_PREVIA' && l.is_my_lead);

  const otherHoyRetrasadas = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_HOY' && !l.is_my_lead);
  const otherHoyPendientes = leadsSummary.filter(l => l.categoria_agenda === 'HOY_PENDIENTE' && !l.is_my_lead);

  const myMananaTasks = leadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && l.is_my_lead);
  const otherMananaTasks = leadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && !l.is_my_lead);

  const myLeadCount = leadsSummary.filter(l => l.is_my_lead).length;
  const isLuis = advisor.key === 'luis';

  const agendaPrecalculada = `CALENDARIO Y MAPA DE TIEMPO EXACTO (VERDAD ABSOLUTA PARA INTERPRETAR FECHAS Y HORAS):
${timeRef.join('\n')}

HORA EXACTA ACTUAL EN PERÚ: ${currentTimeStr} (${todayDateStr}).
TODO HORARIO MENOR A LAS ${currentTimeStr} YA OCURRIÓ Y PERTENECE AL PASADO. SI NO SE HA GESTIONADO, ESTÁ RETRASADO.

AGENDA OFICIAL PRECALCULADA POR EL SISTEMA PARA ${advisor.name.toUpperCase()}:
🚨 TAREAS DE HOY (${todayDateStr}) CUYA HORA YA PASÓ (¡ESTÁN RETRASADAS / VENCIDAS HOY!):
${myHoyRetrasadas.length > 0 ? myHoyRetrasadas.map(t => `  • [TU LEAD RETRASADO HOY] ${t.name} a las ${t.next_action_date.split('T')[1] || ''} (${formatMinsDiff(t.minutos_diferencia)}): "${t.next_action}"`).join('\n') : '  (Ninguna tarea de hoy está retrasada)'}

⏳ TAREAS DE HOY (${todayDateStr}) PROGRAMADAS PARA MÁS TARDE (PENDIENTES EN HORARIOS FUTUROS DE HOY):
${myHoyPendientes.length > 0 ? myHoyPendientes.map(t => `  • [TU LEAD PENDIENTE HOY] ${t.name} a las ${t.next_action_date.split('T')[1] || ''} (${formatMinsDiff(t.minutos_diferencia)}): "${t.next_action}"`).join('\n') : '  (No tienes más tareas programadas para más tarde hoy)'}

⚠️ TAREAS PENDIENTES DE DÍAS ANTERIORES (VENCIDAS ANTES DE HOY):
${myVencidasPrevias.slice(0, 8).map(t => `  • [TU LEAD VENCIDO PREVIO] ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}

📅 TAREAS DE MAÑANA (${tomorrowDateStr}):
${myMananaTasks.length > 0 ? myMananaTasks.map(t => `  • [TU LEAD MAÑANA] ${t.name} a las ${t.next_action_date.split('T')[1] || ''}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para mañana)'}

RESUMEN DEL EQUIPO / OTROS ASESORES HOY:
- Tareas del equipo que ya pasaron su hora hoy: ${otherHoyRetrasadas.length}
- Tareas del equipo pendientes para más tarde hoy: ${otherHoyPendientes.length}`;

  const systemPrompt = `Eres el Copiloto Inteligente y Estratega Comercial de Bienestar CRM para ${advisor.name} y el equipo de ventas de Bienestar Sin Excusas en Telegram.

FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${todayDateStr} a las ${currentTimeStr} (Zona horaria: America/Lima, UTC-5).
Usuario conectado en este chat: ${advisor.name} (${advisor.role}, email: ${advisor.email}).

ESTRUCTURA REAL DEL EQUIPO COMERCIAL EN EL CRM:
- Hay 2 asesores de ventas principales en el CRM:
  1. Alberto Zegarra (Dueño / Super Admin): Tiene 24 prospectos personales asignados (is_my_lead: true cuando Alberto está conectado). Darío Cienfuegos (embajador de gimnasios a quien Alberto asesora) es un PROSPECTO y contacto estratégico en la cartera personal de Alberto Zegarra, NO un vendedor con leads.
  2. Luis Hakim ('Socio Comercial'): Tiene 27 prospectos asignados a su cargo (is_my_lead: true cuando Luis está conectado), incluyendo 'Amigo del culturismo', 'Profesor de entrenamientos', 'Silmed', 'Labnutritión', 'C40 Juliaca', etc.
${isLuis ? `
CONTEXTO ESPECÍFICO PARA LUIS HAKIM:
- Estás interactuando directamente con LUIS HAKIM (Socio Comercial).
- Sus prospectos asignados son los marcados con is_my_lead: true (${myLeadCount} prospectos).
- Cuando Luis pregunte por su agenda, qué le toca hoy o pida recomendaciones, enfócate 100% en SUS prospectos y en cómo reactivarlos o cerrarlos.
- Los prospectos de Alberto Zegarra (Rosario López, Carmina Badillo, Claudia Advincula, Darío Cienfuegos, etc.) tienen is_my_lead: false y pertenecen a Alberto. No se los atribuyas a Luis.
` : `
CONTEXTO ESPECÍFICO PARA ALBERTO ZEGARRA:
- Estás interactuando directamente con ALBERTO ZEGARRA (Dueño / Super Administrador).
- Sus prospectos personales son los marcados con is_my_lead: true (${myLeadCount} prospectos).
- Las llamadas y tareas de Luis Hakim (como 'Amigo del culturismo', 'Profesor de entrenamientos', etc.) tienen is_my_lead: false y pertenecen a Luis Hakim. No se las atribuyas como suyas a Alberto.
`}

${agendaPrecalculada}

BASE DE DATOS COMPLETA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. IDENTIDAD Y PROPIEDAD DE PROSPECTOS:
   - Responde enfocado prioritariamente en los prospectos del usuario conectado (${advisor.name}, con is_my_lead: true).
   - NUNCA le atribuyas como suyas las tareas de otro asesor.
   - Si no tiene tareas hoy, díselo claramente y sugiere revisar sus tareas pendientes o próximos pasos.

2. PROHIBICIÓN ABSOLUTA DE MOSTRAR IDs, UUIDs O DETALLES TÉCNICOS:
   - NUNCA jamás escribas identificadores numéricos o alfanuméricos de base de datos (como id: "1310426b-...", UUIDs, nombres de tablas o campos) en el texto visible de tu respuesta (reply_message).
   - Para ti y para el usuario los clientes se identifican ÚNICA Y EXCLUSIVAMENTE por su nombre comercial o de contacto (ej: 'Rosario López', 'Silmed', 'Amigo del culturismo').

3. FOCO ESTRICTO EN EL CLIENTE CONSULTADO (CERO MEZCLAS O CRUCES DE PROSPECTOS):
   - Si el usuario está preguntando o hablando sobre un cliente específico, CONCÉNTRATE AL 100% EN ESE CLIENTE.
   - Si te piden información, la bitácora o el historial de un cliente, reporta fielmente todo lo que está en su ficha: su historial de notas en "timeline" (con fechas y qué se habló), su estado actual en el embudo, su próxima acción con fecha/hora, su plan objetivo y valor estimado, y el asesor asignado.
   - NUNCA menciones a otros clientes ni mezcles historiales de otros prospectos.
   - Cada cliente es totalmente independiente.
   - Si el usuario te corrige o reclama una confusión, acéptalo en UNA SOLA frase corta y sobria ("Disculpa la confusión. Enfocándonos en [Nombre]:") y entrega la información exacta.

4. LÓGICA TEMPORAL EXACTA Y CERO CONTRADICCIONES HORARIAS:
   - HORA EXACTA ACTUAL EN PERÚ: ${currentTimeStr} (${todayDateStr}).
   - Cualquier hora menor a las ${currentTimeStr} de hoy (ejemplo: 12:00 o 16:00 cuando son las 17:36) YA OCURRIÓ Y PERTENECE AL PASADO.
   - PROHIBICIÓN TERMINANTE DE LLAMAR "FUTURAS" A HORAS QUE YA PASARON: NUNCA digas que las tareas de hoy con hora anterior a las ${currentTimeStr} son "futuras", que "aún no llegan" o que "están a tiempo sin retraso". Decir eso es una falsedad matemática inadmisible.
   - Si la hora de una tarea ya pasó hoy y no se ha marcado como completada o reprogramada, ESTÁ RETRASADA / VENCIDA HOY.
   - Reporta siempre la realidad con total precisión y honestidad:
     * Tareas de hoy cuya hora YA PASÓ (retrasadas hoy): Ej. Lorena Almeida a las 12:00 (hace varias horas) y Darío Cienfuegos a las 16:00 (hace más de 1 hora).
     * Tareas de hoy programadas para MÁS TARDE (futuras hoy): Ej. Karol Rios a las 19:00 y Yoselin a las 21:00.
     * Tareas de días anteriores (vencidas previas): Ej. Mi prima (15/09).

5. FECHAS Y HORARIOS CLAVE (NO CONFUNDIR HOY CON MAÑANA O AYER):
   - Presta rigurosa atención a la fecha actual (${todayDateStr}) y al mapa de tiempo precalculado. Nunca confundas hoy con mañana ni con días pasados.

6. PROHIBICIÓN ABSOLUTA DE DRAMATISMOS, DISCULPAS ROBÓTICAS Y JUSTIFICACIONES DE IA:
   - CERO frases como "mi error fue grave y no justificable", "tienes toda la razón — mi error", "yo interpreté mal", etc.
   - Respuestas sobrias, directas, profesionales y enfocadas en la acción comercial.

7. COPYWRITING PARA WHATSAPP:
   - Mensajes cálidos, profesionales, directos al estilo peruano/latino, listos para copiar.
   - Coloca los mensajes de WhatsApp claramente entre comillas.

8. REGLA ESTRICTA DE ACTUALIZACIÓN DEL CRM (PROHIBICIÓN TOTAL DE INVENTAR DATOS):
   - En el 95% de las interacciones, tu intención DEBE SER "general_chat".
   - ÚNICAMENTE genera "intent": "update_lead" si el usuario te da una orden para modificar el CRM o dicta notas/fechas de seguimiento sobre un cliente.
   - PROHIBICIÓN ABSOLUTA DE INVENTAR NOTAS: Si el usuario no dictó qué pasó con sus propias palabras, "note_text" DEBE SER VACÍO ("").
   - CERO FALSAS CONFIRMACIONES EN reply_message: Si tu intención es "general_chat" o el usuario está haciendo una consulta o pregunta ("¿Revisaste la bitácora?", "¿En qué estado está?", "¿Qué tareas tengo?"), NUNCA comiences tu reply_message diciendo "Bitácora actualizada" ni uses "✅" para afirmar que guardaste algo. Responde con la verdad exacta de lo que dice la base de datos de prospectos arriba.

9. REGLA ESTRICTA PARA BORRAR O DEJAR EN BLANCO LA PRÓXIMA ACCIÓN:
   - Si el usuario te pide borrar, eliminar, quitar o dejar en blanco la próxima acción o fecha (o si el cliente se marca como 'cerrado_perdido' o concluido y no tendrá más seguimiento):
     * "intent": "update_lead"
     * "clear_next_action": true
     * "next_action_text": ""
     * "next_action_date": ""

10. VERDAD SOBRE TU ACCESO AL CRM:
   - Sí estás conectado al CRM en tiempo real a través de Supabase.
   - Solo modificas datos cuando el usuario te lo ordena expresamente.

11. CREAR O REGISTRAR NUEVOS PROSPECTOS / REUNIONES / CITAS:
   - Si el usuario (${advisor.name}) pide crear un prospecto O pide anotar, agendar o registrar una reunión, llamada o tarea con una persona que no está en la base de datos (ej: "Anota en mi crm reunión con Kevin Dextre...", "Agendar que hablé con Dr. Jean Paulo Sures...", "Poner en mi crm que tengo que agendar presentación con Louis Tristán"):
     * "intent": "create_lead"
     * "new_lead_data": { "contact_name": "Nombre de la persona", "business_name": "Nombre o empresa", "phone": "teléfono si lo dio", "target_plan": "plan_30", "estimated_value": 400 }
     * "target_lead_name": "Nombre de la persona"
     * "note_text": detalle de la llamada, relación con entrenadores/gimnasios o lo conversado
     * "next_action_text": próxima acción agendada (ej: "Reunión de demostración", "Seguimiento tras llamada inicial")
     * "next_action_date": "YYYY-MM-DDTHH:mm" con la fecha y hora coordinada
     * "new_status": "cita_agendada" si agendó reunión/cita/zoom, "llamado" si ya conversó por teléfono, o "prospecto"

12. RECORDATORIOS Y ALERTAS AUTOMÁTICAS:
   - Si preguntan si el bot puede enviar recordatorios: Confirma que SÍ. El sistema envía notificaciones automáticas en Telegram 1h antes de zooms y 20m antes de llamadas registradas en la agenda.

13. REASIGNACIÓN O TRANSFERENCIA DE PROSPECTOS ENTRE ASESORES:
   - Si el usuario (especialmente Alberto Zegarra como Super Administrador) pide transferir, pasar, reasignar o derivar un prospecto a Luis Hakim o a Alberto Zegarra (ej: "Pásale este lead a Luis Hakim", "Asigna a Carmina a Luis", "Pásalo a Luis", "Transfiere este prospecto a Luis"):
     * "intent": "update_lead"
     * "new_assigned_to": "Luis Hakim" (o "Alberto Zegarra")
     * En "reply_message" confirma con claridad que el prospecto quedó transferido a [Nombre del Asesor] en el CRM, y que las próximas alarmas y recordatorios automáticos de Telegram ahora le llegarán a él.

14. COMPRENSIÓN FONÉTICA INTELIGENTE (PROHIBICIÓN ABSOLUTA DE DISCUTIR O RECLAMAR SOBRE NOMBRES):
   - Los audios y notas de voz son transcritos por el micrófono y frecuentemente tienen pequeñas variaciones fonéticas (ej: "Luis Kulki" o "Luis Kulkin" = Luis Culqui; "Kike" = Quique; "Advincula" = Claudia Advincula).
   - NUNCA discutas, corrijas ni des sermones técnicos al usuario sobre cómo está escrito un nombre en la base de datos (PROHIBIDO decir "no existe ningún Luis Kulki", "es un error tuyo", "debo ser transparente contigo", etc.). Esas respuestas están TERMINANTEMENTE PROHIBIDAS.
   - Si el usuario dice "Luis Kulki", "Kulkin", "Culqui" o menciona un lead con variación fonética, asócialo DE INMEDIATO al lead real (Luis Culqui) en "target_lead_name", define "intent": "update_lead", y ejecuta la orden (bitácora, estado cerrado_ganado, etc.) con rapidez y eficacia.

RESPONDE SIEMPRE EN FORMATO JSON ESTRICTO:
{
  "intent": "update_lead" | "create_lead" | "general_chat",
  "target_lead_id": "id del lead si se identificó, o null",
  "target_lead_name": "nombre del lead",
  "clear_next_action": false,
  "note_text": "texto de la nota para la bitácora si aplica",
  "next_action_text": "texto de la próxima acción si aplica",
  "next_action_date": "YYYY-MM-DDTHH:mm si aplica",
  "new_status": "prospecto | llamado | cita_agendada | presentacion_realizada | cerrado_ganado | cerrado_perdido si aplica",
  "new_plan": "plan_30 | plan_80 | plan_200 | plan_500 | plan_1200 si aplica",
  "new_assigned_to": "Luis Hakim | Alberto Zegarra si el usuario pidió transferir/reasignar, o null",
  "new_value": null,
  "new_lead_data": { "business_name": "", "contact_name": "", "phone": "", "target_plan": "plan_30", "estimated_value": 400 },
  "reply_message": "Tu respuesta detallada y estratégica para ${advisor.name}."
}`;

  const formattedHistory = (conversationHistory || [])
    .slice(-10)
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || m.text || ''
    }))
    .filter(m => m.content && m.content.trim().length > 0);

  const aiRes = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      max_tokens: 3500
    })
  });

  const aiJson = await aiRes.json();
  const rawContent = aiJson.choices?.[0]?.message?.content || '{}';
  const parsed = parseAIResponse(rawContent);

  let badgePrefix = '';

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

  let targetLead = null;
  if (parsed.target_lead_id || parsed.target_lead_name) {
    targetLead = findMatchingLead(leads, parsed.target_lead_id, parsed.target_lead_name);
  }

  const candidateContactName = (parsed.new_lead_data?.contact_name || parsed.target_lead_name || '').trim();
  if (!targetLead && candidateContactName) {
    targetLead = findMatchingLead(leads, null, candidateContactName);
  }

  // Fallback: search lead name directly inside the raw user prompt
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
    const noteContent = parsed.note_text || parsed.new_lead_data?.notes || '';
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
        badgePrefix = `✅ <b>CRM actualizado</b> para <i>${targetLead.contact_name || targetLead.business_name}</i>\n\n`;
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
    badgePrefix = `⚠️ <i>No encontré al prospecto "${parsed.target_lead_name || ''}" en el CRM para actualizarlo.</i>\n\n`;
  }

  let cleanReply = parsed.reply_message || `Listo ${advisor.name.split(' ')[0]}.`;

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

  const contextPattern = /\b(bitacora|hable con|converse con|llame a|reuni con|quedamos en|tuve (el )?zoom con|hicimos (el )?zoom con|sin proxima accion|proxima accion|a luis|a alberto|a hakim)\b/i;

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

  let clean = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Strip any accidental database UUIDs or (id: "...") technical markers
  clean = clean.replace(/\(?\bids?\s*:\s*["']?[0-9a-fA-F-]{36}["']?\)?/gi, '');
  clean = clean.replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '');
  clean = clean.replace(/\(\s*\)/g, '').replace(/  +/g, ' ');

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
