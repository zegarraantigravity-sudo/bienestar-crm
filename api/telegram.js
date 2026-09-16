import { createClient } from '@supabase/supabase-js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8657118019:AAHZpcgn2tLTHY58FI01nlgV5LDxesEq1SU';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fzwfkdamebyzywlqhtes.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_BE8kihWp5Uhg8re4CB3xlA_Ahb-3zWY';

const DEFAULT_KEY = 'sk-ws-H.DMLLELE.Ns7U.MEQCIEQeFcXistPzyFJ3JaFIfIwVAvEaxrfhN9E8et6HLLadAiAOEVqQ8dMN1M0bBuZEUdsC-hotw6l_Fm5LUUJ8gR9FOw';
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
      const msg = `👤 <b>Perfil vinculado en este chat de Telegram:</b>\n\n` +
        `• <b>Asesor:</b> ${advisor.name}\n` +
        `• <b>Rol:</b> ${advisor.role}\n` +
        `• <b>Email CRM:</b> ${advisor.email}\n` +
        `• <b>Telegram Chat ID:</b> <code>${chatId}</code>\n\n` +
        `🔄 <i>Para cambiar de asesor en este chat, escribe:</i>\n` +
        `• <code>/soy_luis</code> si eres Luis Hakim\n` +
        `• <code>/soy_alberto</code> si eres Alberto Zegarra`;
      await sendTelegramMessage(chatId, msg);
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

    // If message is a voice note (audio message)
    if (message.voice) {
      await sendChatAction(chatId, 'typing');
      try {
        const fileId = message.voice.file_id;
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
    const { replyText, rawReply } = await processUserQuery(userText, advisor, history);
    await sendTelegramMessage(chatId, replyText);

    // Persist updated conversation history
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: rawReply });
    await saveTelegramUserSession(chatId, advisor.key, history, fromUser);

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

  // Parse leads summary and associate ownership
  const leadsSummary = (leads || []).map(l => {
    let timeline = [];
    let nextAction = '';
    let nextActionDate = '';
    try {
      const p = JSON.parse(l.notes || '{}');
      if (Array.isArray(p)) timeline = p.map(n => n.text);
      else if (p && typeof p === 'object') {
        timeline = (p.timeline || []).map(n => n.text);
        nextAction = p.next_action || '';
        nextActionDate = p.next_action_date || '';
      } else if (l.notes) {
        timeline = [l.notes];
      }
    } catch (e) {
      if (l.notes) timeline = [l.notes];
    }

    let categoria_agenda = 'SIN_FECHA';
    if (nextActionDate) {
      if (nextActionDate.startsWith(todayPeruYmd)) {
        categoria_agenda = 'HOY';
      } else if (nextActionDate > todayPeruYmd) {
        categoria_agenda = 'FUTURO';
      } else {
        categoria_agenda = 'VENCIDA';
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
      phone: l.phone,
      client_type: l.client_type,
      status: l.status,
      target_plan: l.target_plan,
      estimated_value: l.estimated_value,
      advisor_name: leadAdvisor,
      is_my_lead: isMyLead,
      next_action: nextAction,
      next_action_date: nextActionDate,
      categoria_agenda,
      timeline: timeline
    };
  });

  const myHoyTasks = leadsSummary.filter(l => l.categoria_agenda === 'HOY' && l.is_my_lead);
  const otherHoyTasks = leadsSummary.filter(l => l.categoria_agenda === 'HOY' && !l.is_my_lead);
  const myMananaTasks = leadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && l.is_my_lead);
  const otherMananaTasks = leadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && !l.is_my_lead);
  const myVencidas = leadsSummary.filter(l => l.categoria_agenda === 'VENCIDA' && l.is_my_lead);

  const myLeadCount = leadsSummary.filter(l => l.is_my_lead).length;
  const isLuis = advisor.key === 'luis';

  const agendaPrecalculada = `CALENDARIO Y MAPA DE TIEMPO EXACTO (VERDAD ABSOLUTA PARA INTERPRETAR FECHAS):
${timeRef.join('\n')}

AGENDA OFICIAL PRECALCULADA POR EL SISTEMA PARA ${advisor.name.toUpperCase()}:
- TAREAS PERSONALES DE ${advisor.name.toUpperCase()} PARA HOY (${todayDateStr}):
${myHoyTasks.length > 0 ? myHoyTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : `  (No tienes tareas personales agendadas para hoy en tus ${myLeadCount} prospectos)`}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA HOY:
${otherHoyTasks.length > 0 ? otherHoyTasks.map(t => `  • [Asesor: ${t.advisor_name}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (Ningún otro asesor tiene tareas para hoy)'}

- TAREAS PERSONALES DE ${advisor.name.toUpperCase()} PARA MAÑANA (${tomorrowDateStr}):
${myMananaTasks.length > 0 ? myMananaTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para mañana)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA MAÑANA:
${otherMananaTasks.length > 0 ? otherMananaTasks.map(t => `  • [Asesor: ${t.advisor_name}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas del equipo para mañana)'}

- TAREAS PERSONALES PENDIENTES CON FECHA ANTERIOR (VENCIDAS):
${myVencidas.slice(0, 8).map(t => `  • [TU LEAD] ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}`;

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
   - NUNCA menciones a otros clientes ni mezcles historiales de otros prospectos.
   - Cada cliente es totalmente independiente.
   - Si el usuario te corrige o reclama una confusión, acéptalo en UNA SOLA frase corta y sobria ("Disculpa la confusión. Enfocándonos en [Nombre]:") y entrega la información exacta.

4. FIDELIDAD ABSOLUTA A LAS HORAS Y FECHAS AGENDADAS (CERO HORAS INVENTADAS):
   - Lee con exactitud quirúrgica el campo next_action_date de cada cliente.
   - Solo reporta las horas exactas que figuran en el registro.

5. FECHAS Y HORARIOS CLAVE (NO CONFUNDIR HOY CON MAÑANA):
   - Presta rigurosa atención a la fecha actual (${todayDateStr}) y el mapa de tiempo.

6. PROHIBICIÓN ABSOLUTA DE DRAMATISMOS, DISCULPAS ROBÓTICAS Y JUSTIFICACIONES DE IA:
   - CERO frases como "mi error fue grave y no justificable", "tienes toda la razón — mi error", "yo interpreté mal", etc.
   - Respuestas sobrias, directas, profesionales y enfocadas en la acción comercial.

7. COPYWRITING PARA WHATSAPP:
   - Mensajes cálidos, profesionales, directos al estilo peruano/latino, listos para copiar.
   - Coloca los mensajes de WhatsApp claramente entre comillas.

8. REGLA ESTRICTA DE ACTUALIZACIÓN DEL CRM (PROHIBICIÓN TOTAL DE INVENTAR DATOS):
   - En el 95% de las interacciones, tu intención DEBE SER "general_chat".
   - ÚNICAMENTE genera "intent": "update_lead" si el usuario te da una orden DIRECTA, EXPLÍCITA E INEQUÍVOCA para modificar el CRM (ej: "Anota en la bitácora...", "Registra llamada...", "Agenda cita...").
   - PROHIBICIÓN ABSOLUTA DE INVENTAR NOTAS: Si el usuario no dictó qué pasó con sus propias palabras, "note_text" DEBE SER VACÍO ("").

9. REGLA ESTRICTA PARA BORRAR O DEJAR EN BLANCO LA PRÓXIMA ACCIÓN:
   - Si el usuario te pide borrar, eliminar, quitar o dejar en blanco la próxima acción o fecha (o si el cliente se marca como 'cerrado_perdido' o concluido y no tendrá más seguimiento):
     * "intent": "update_lead"
     * "clear_next_action": true
     * "next_action_text": ""
     * "next_action_date": ""

10. VERDAD SOBRE TU ACCESO AL CRM:
   - Sí estás conectado al CRM en tiempo real a través de Supabase.
   - Solo modificas datos cuando el usuario te lo ordena expresamente.

11. CREAR PROSPECTOS:
   - Si el usuario pide crear un prospecto: "intent": "create_lead". Extrae contact_name, business_name, phone, target_plan, estimated_value.

12. RECORDATORIOS Y ALERTAS AUTOMÁTICAS:
   - Si preguntan si el bot puede enviar recordatorios: Confirma que SÍ. El sistema envía notificaciones automáticas en Telegram 1h antes de zooms y 20m antes de llamadas registradas en la agenda.

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
      temperature: 0.2
    })
  });

  const aiJson = await aiRes.json();
  const rawContent = aiJson.choices?.[0]?.message?.content || '{}';
  const parsed = parseAIResponse(rawContent);

  let badgePrefix = '';

  const isUserExplicitUpdate = isExplicitUpdateCommand(userMessage);
  const isUserExplicitCreate = isExplicitCreateCommand(userMessage);

  // Handle Intent: Update Lead in Supabase ONLY IF user explicitly commanded it
  if (parsed.intent === 'update_lead' && isUserExplicitUpdate && (parsed.target_lead_id || parsed.target_lead_name)) {
    const targetLead = (leads || []).find(l => {
      if (parsed.target_lead_id && l.id === parsed.target_lead_id) return true;
      const searchName = (parsed.target_lead_name || '').toLowerCase().trim();
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

      // Only add to timeline if the user actually stated note details
      if (parsed.note_text && parsed.note_text.trim().length > 0) {
        const noteWithAuthor = `${parsed.note_text.trim()} [Registrado por ${advisor.name} vía Telegram]`;
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
      if (parsed.new_plan) updateFields.target_plan = parsed.new_plan;

      await supabase.from('leads').update(updateFields).eq('id', targetLead.id);
      badgePrefix = `✅ <b>Bitácora actualizada en CRM</b> para <i>${targetLead.contact_name || targetLead.business_name}</i>\n\n`;
    }
  }

  // Handle Intent: Create Lead in Supabase ONLY IF user explicitly commanded it
  if (parsed.intent === 'create_lead' && isUserExplicitCreate && parsed.new_lead_data?.contact_name) {
    const d = parsed.new_lead_data;
    const newLeadRecord = {
      contact_name: d.contact_name,
      business_name: d.business_name || d.contact_name,
      phone: d.phone || '',
      target_plan: d.target_plan || 'plan_30',
      estimated_value: d.estimated_value || 400,
      status: 'prospecto',
      assigned_to: advisor.name,
      created_at: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      notes: JSON.stringify({
        timeline: [{ date: new Date().toISOString(), text: `Prospecto creado vía Copiloto Telegram por ${advisor.name}` }],
        next_action: 'Enviar mensaje de bienvenida y presentación',
        next_action_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
      })
    };

    await supabase.from('leads').insert([newLeadRecord]);
    badgePrefix = `🎉 <b>Nuevo prospecto creado en CRM (asignado a ${advisor.name}):</b> <i>${d.contact_name}</i>\n\n`;
  }

  const finalHtml = badgePrefix + formatForTelegramHtml(parsed.reply_message || `Listo ${advisor.name.split(' ')[0]}.`);
  return {
    replyText: finalHtml,
    rawReply: parsed.reply_message || `Listo ${advisor.name.split(' ')[0]}.`
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
// Intent Validation Guardrails
// -------------------------------------------------------------
function isExplicitUpdateCommand(userText) {
  if (!userText || typeof userText !== 'string') return false;
  const t = userText.toLowerCase().trim();

  // If user explicitly says not to modify or asks a negative question
  if (/\bno\s+(modificar|modifiques|cambies|actualices|toques|hagas|guardes|anotes|registres)\b/i.test(t)) {
    return false;
  }

  // If user is just asking a question without an action verb
  if ((t.includes('?') || t.includes('¿')) && !/\b(registra|anota|agenda|guarda|cambia|actualiza|borra|elimina|limpia|quita)\b/i.test(t)) {
    return false;
  }

  // Must have clear trigger verbs or actions:
  return /\b(registra|anota|guarda|agenda|actualiza|agrega|cambia|programa|ponle|marca|anótale|agéndale|escribe en|bitácora|hablé con|conversé con|llamé a|reuní con|quedamos en|borra|borrar|elimina|eliminar|quita|quitar|limpia|limpiar|deja en blanco|dejar en blanco|dejarlo en blanco|d[eé]jalo en blanco)\b/i.test(t);
}

function isExplicitCreateCommand(userText) {
  if (!userText || typeof userText !== 'string') return false;
  const t = userText.toLowerCase().trim();
  if (/\bno\s+(crees|agregues|registres)\b/i.test(t)) return false;
  return /\b(crea|crear|agrega|agregar|nuevo prospecto|nuevo cliente|registra nuevo)\b/i.test(t);
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

  try {
    return JSON.parse(clean);
  } catch (e) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch (err) {}
    }
    return { intent: 'general_chat', reply_message: clean };
  }
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
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  // Convert *italic* to <i>italic</i>
  clean = clean.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');

  // Convert WhatsApp quotes into blockquotes
  clean = clean.replace(/"([^"]{25,})"/g, '<blockquote>"$1"</blockquote>');
  clean = clean.replace(/“([^”]{25,})”/g, '<blockquote>“$1”</blockquote>');

  return clean;
}

async function sendTelegramMessage(chatId, htmlText) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML'
      })
    });
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
