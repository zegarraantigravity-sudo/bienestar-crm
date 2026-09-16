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

    return res.status(200).json({ status: 'ok', service: 'Bienestar CRM Telegram Copilot' });
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
    const userName = fromUser.first_name || 'Alberto';

    // Update last known admin chatId
    lastAdminChatId = chatId;

    // Handle /start command
    if (message.text === '/start') {
      await saveTelegramHistory([], chatId);
      const welcome = `¡Hola ${userName}! Soy tu <b>Copiloto Ejecutivo de Bienestar CRM</b> en Telegram 🤖✨\n\n` +
        `Estoy conectado en tiempo real a tu base de datos de prospectos en Supabase.\n\n` +
        `<b>¿Qué puedes hacer conmigo aquí?</b>\n` +
        `• 📋 <b>Consultar tu agenda:</b> Pregúntame <i>"¿Qué tareas o llamadas tengo para hoy?"</i>\n` +
        `• 🎯 <b>Estrategia de clientes:</b> <i>"¿Qué me recomiendas para Yoselin y qué le escribo por WhatsApp?"</i>\n` +
        `• 🎙️ <b>Dictarme por audio o texto:</b> <i>"Hablé con Claudia, me dijo que le interesa el plan de 30 para su cuñada. Agenda llamada para el viernes a las 11:00 am."</i>\n` +
        `• ➕ <b>Crear prospectos:</b> <i>"Crea un prospecto para Juan Pérez, coach de gym, cel 999888777, plan 30."</i>\n` +
        `• 🔄 <b>Reiniciar conversación:</b> Escribe <code>/nuevo</code> o <code>/reset</code> para empezar un nuevo tema.\n\n` +
        `¡Pruébame ahora mismo escribiéndome o enviándome una nota de voz! 👇`;

      await sendTelegramMessage(chatId, welcome);
      return res.status(200).json({ ok: true });
    }

    // Handle /reset or /nuevo command
    if (message.text === '/reset' || message.text === '/nuevo' || message.text === '/clear') {
      await saveTelegramHistory([], chatId);
      await sendTelegramMessage(chatId, '🔄 <b>Conversación reiniciada.</b>\n\n¿En qué cliente o tarea nos enfocamos ahora?');
      return res.status(200).json({ ok: true });
    }

    // Handle /agenda command
    if (message.text === '/agenda' || message.text === '/tareas') {
      await sendChatAction(chatId, 'typing');
      const history = await getTelegramHistory();
      const { replyText, rawReply } = await processUserQuery('¿Qué tareas o llamadas tengo para hoy?', userName, history);
      await sendTelegramMessage(chatId, replyText);
      history.push({ role: 'user', content: '¿Qué tareas o llamadas tengo para hoy?' });
      history.push({ role: 'assistant', content: rawReply });
      await saveTelegramHistory(history, chatId);
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
            // Notify user of transcribed audio
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

    // Retrieve previous conversation history for multi-turn context
    const history = await getTelegramHistory();

    // Process through Copilot AI with conversation history
    const { replyText, rawReply } = await processUserQuery(userText, userName, history);
    await sendTelegramMessage(chatId, replyText);

    // Persist updated conversation history
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: rawReply });
    await saveTelegramHistory(history, chatId);

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
// Helper: Get / Save Telegram Conversation History in Supabase
// -------------------------------------------------------------
async function getTelegramHistory() {
  try {
    const { data } = await supabase
      .from('leads')
      .select('notes')
      .eq('business_name', 'SYSTEM_TELEGRAM_SESSION')
      .maybeSingle();

    if (data?.notes) {
      const parsed = JSON.parse(data.notes);
      if (Array.isArray(parsed.history)) return parsed.history;
    }
  } catch (e) {
    console.warn('Error reading telegram history:', e);
  }
  return [];
}

async function saveTelegramHistory(history, chatId = null) {
  try {
    const { data } = await supabase
      .from('leads')
      .select('id, notes')
      .eq('business_name', 'SYSTEM_TELEGRAM_SESSION')
      .maybeSingle();

    if (data?.id) {
      let existing = {};
      try { existing = JSON.parse(data.notes || '{}'); } catch (e) {}
      const resolvedChatId = chatId || existing.chat_id || lastAdminChatId;

      await supabase.from('leads').update({
        notes: JSON.stringify({
          history: history.slice(-12),
          chat_id: resolvedChatId,
          updated_at: new Date().toISOString()
        })
      }).eq('id', data.id);
    }
  } catch (e) {
    console.warn('Error saving telegram history:', e);
  }
}

// -------------------------------------------------------------
// Helper: Process Query with Copilot & Supabase
// -------------------------------------------------------------
async function processUserQuery(userMessage, userName = 'Alberto Zegarra', conversationHistory = []) {
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

  // Parse leads summary
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
    let advisor = 'Alberto Zegarra';
    if (assigned.includes('luis') || assigned.includes('hakim') || assigned.includes('socio comercial')) {
      advisor = 'Luis Hakim';
    } else {
      advisor = 'Alberto Zegarra';
    }

    const isMyLead = advisor === 'Alberto Zegarra';

    return {
      id: l.id,
      name: l.contact_name || l.business_name,
      business: l.business_name,
      phone: l.phone,
      client_type: l.client_type,
      status: l.status,
      target_plan: l.target_plan,
      estimated_value: l.estimated_value,
      advisor_name: advisor,
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

  const agendaPrecalculada = `CALENDARIO Y MAPA DE TIEMPO EXACTO (VERDAD ABSOLUTA PARA INTERPRETAR FECHAS):
${timeRef.join('\n')}

AGENDA OFICIAL PRECALCULADA POR EL SISTEMA:
- TAREAS PERSONALES DE ALBERTO ZEGARRA PARA HOY (${todayDateStr}):
${myHoyTasks.length > 0 ? myHoyTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para hoy)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA HOY:
${otherHoyTasks.length > 0 ? otherHoyTasks.map(t => `  • [Asesor: ${t.advisor_name}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (Ningún otro asesor tiene tareas para hoy)'}

- TAREAS PERSONALES DE ALBERTO ZEGARRA PARA MAÑANA (${tomorrowDateStr}):
${myMananaTasks.length > 0 ? myMananaTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para mañana)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA MAÑANA:
${otherMananaTasks.length > 0 ? otherMananaTasks.map(t => `  • [Asesor: ${t.advisor_name}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas del equipo para mañana)'}

- TAREAS PERSONALES PENDIENTES CON FECHA ANTERIOR (VENCIDAS):
${myVencidas.slice(0, 6).map(t => `  • [TU LEAD] ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}`;

  const systemPrompt = `Eres el Copiloto Inteligente y Estratega Comercial de Bienestar CRM para Alberto Zegarra y su equipo de ventas de Bienestar Sin Excusas en Telegram.

FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${todayDateStr} a las ${currentTimeStr} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: Alberto Zegarra (Dueño / Super Administrador).

ESTRUCTURA REAL DEL EQUIPO COMERCIAL EN EL CRM:
- Hay 2 vendedores en el CRM:
  1. Alberto Zegarra (Dueño / Super Admin): Tiene 24 prospectos personales asignados (is_my_lead: true). Uno de sus prospectos y contactos estratégicos se llama Darío Cienfuegos (embajador de gimnasios a quien Alberto asesora).
  2. Luis Hakim ('Socio Comercial'): Tiene 27 prospectos asignados a su cargo (incluyendo 'Amigo del culturismo', 'Profesor de entrenamientos', etc.).
- Darío Cienfuegos NO es un vendedor con cartera propia asignada en el CRM; es un PROSPECTO/contacto en la cartera de Alberto Zegarra.
- Por tanto, las llamadas del equipo de hoy (como 'Amigo del culturismo' a las 18:30 y 'Profesor de entrenamientos' a las 18:30) son responsabilidad exclusiva del vendedor Luis Hakim.

${agendaPrecalculada}

BASE DE DATOS COMPLETA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. IDENTIDAD Y PROPIEDAD DE PROSPECTOS:
   - Responde enfocado prioritariamente en los prospectos personales de Alberto Zegarra (is_my_lead: true).
   - NUNCA le atribuyas como suyas las tareas de Luis Hakim.
   - Si Alberto no tiene tareas hoy, díselo claramente y menciona que sus llamadas arrancan mañana con sus clientes asignados.
   - Si Alberto te pregunta por Darío Cienfuegos, recuerda que Darío es un contacto de Alberto (embajador), no un vendedor con leads.

2. PROHIBICIÓN ABSOLUTA DE MOSTRAR IDs, UUIDs O DETALLES TÉCNICOS:
   - NUNCA jamás escribas identificadores numéricos o alfanuméricos de base de datos (como id: "1310426b-...", UUIDs, nombres de tablas o campos) en el texto de tu respuesta a Alberto (reply_message).
   - Para ti y para Alberto los clientes se identifican ÚNICA Y EXCLUSIVAMENTE por su nombre comercial o de contacto (ej: 'Rosario López', 'Carmina Badillo').
   - El campo 'id' de la base de datos es exclusivamente para uso interno de la máquina en 'target_lead_id' si vas a actualizar el registro, NUNCA para el texto visible.

3. FOCO ESTRICTO EN EL CLIENTE CONSULTADO (CERO MEZCLAS O CRUCES DE PROSPECTOS):
   - Si Alberto está preguntando o hablando sobre un cliente específico (ej: Rosario López), CONCÉNTRATE AL 100% EN ESE CLIENTE.
   - NUNCA menciones a otros clientes de su cartera (como Darío Cienfuegos, Carmina Badillo, etc.) a menos que Alberto te pregunte explícitamente por ellos o pida un resumen de su agenda completa.
   - Cada cliente es totalmente independiente: no mezcles sus historiales, tareas ni agendas.
   - Si Alberto te cuestiona por qué mencionaste a otro cliente o qué pasó, NO des discursos de IA sobre errores de asociación. Responde con sobriedad y en una sola frase breve: "Disculpa la confusión, Alberto. Enfocándonos 100% en [Nombre del cliente]:" y entrega inmediatamente la información exacta de ese cliente y el copy propuesto.

4. FIDELIDAD ABSOLUTA A LAS HORAS Y FECHAS AGENDADAS (CERO HORAS INVENTADAS):
   - Lee con exactitud quirúrgica el campo next_action_date de cada cliente:
     * Rosario López: Su tarea está programada para MAÑANA MIÉRCOLES 16 DE SETIEMBRE A LAS 11:00 A.M. (next_action_date: 2026-09-16T11:00). NUNCA inventes horas ficticias como "18:59" ni "al cierre". Su hora oficial registrada es 11:00 a.m.
     * Darío Cienfuegos: Su tarea está agendada para MAÑANA MIÉRCOLES 16 DE SETIEMBRE A LAS 16:00 (4:00 p.m.).
     * Carmina Badillo: Su reunión por ZOOM está agendada para MAÑANA MIÉRCOLES 16 DE SETIEMBRE A LAS 22:00 (10:00 p.m.).
   - Solo reporta las horas exactas que figuran en el registro.

5. FECHAS Y HORARIOS CLAVE (NO CONFUNDIR HOY CON MAÑANA):
   - HOY es martes 15 de setiembre de 2026. "Esta noche" se refiere ÚNICAMENTE a hoy martes 15 en la noche.
   - MAÑANA es miércoles 16 de setiembre de 2026.
   - Carmina Badillo: Su reunión por ZOOM es MAÑANA MIÉRCOLES 16 a las 22:00 (10:00 p.m.). NUNCA le digas a Alberto que el zoom de Carmina es "hoy" o "esta noche". Es MAÑANA miércoles en la noche. Si pide mensaje de confirmación, sugiere enviarlo mañana por la tarde (hacia las 6:00 o 7:00 p.m.).

6. INTERPRETACIÓN DE TIEMPO Y ACCIONES REPORTADAS POR EL USUARIO:
   - Cuando Alberto dice "hoy le mandé...", "hablé hoy con él", o menciona una acción que hizo hoy:
     * La acción ocurrió HOY (${todayDateStr}).
     * Cualquier próximo paso o seguimiento se calcula a partir de HOY (mañana a las 24h, o jueves a las 48h).

7. PROHIBICIÓN ABSOLUTA DE DRAMATISMOS, DISCULPAS ROBÓTICAS Y JUSTIFICACIONES DE IA:
   - CERO frases como "mi error fue grave y no justificable", "tienes toda la razón — mi error", "yo interpreté mal y asocié a...", "falla de mi modelo", "revisé mal la base de datos", etc.
   - CERO explicaciones introspectivas sobre algoritmos o lecturas apresuradas.
   - Si Alberto te hace una corrección o detecta un malentendido, acéptalo en UNA SOLA frase corta y sobria ("Disculpa la confusión, Alberto. Enfocándonos en [Cliente]:") y entrega la información ejecutiva correcta.

8. COPYWRITING PARA WHATSAPP:
   - Mensajes cálidos, naturales al estilo peruano/latino, directos y listos para copiar.
   - Coloca los mensajes de WhatsApp claramente entre comillas.

9. REGISTRAR O ACTUALIZAR CLIENTES:
   - Si Alberto te pide registrar una nota, llamada o acordar una cita/tarea:
     * Establece "intent": "update_lead".
     * Extrae target_lead_id, note_text, next_action_text y next_action_date (YYYY-MM-DDTHH:mm).

10. CREAR PROSPECTOS:
   - Si Alberto pide crear un prospecto:
     * Establece "intent": "create_lead".
     * Extrae new_lead_data: { business_name, contact_name, phone, target_plan, estimated_value }.

11. RECORDATORIOS Y ALERTAS AUTOMÁTICAS:
   - Si Alberto te pregunta si puedes enviarle notificaciones o recordatorios en Telegram (ej: avisarle antes de un Zoom o llamada):
     * Respóndele que SÍ, el sistema puede enviarle notificaciones automáticas y proactivas aquí mismo en Telegram.
     * Explica con claridad cómo funciona: El sistema revisa la agenda del CRM y le envía automáticamente una alerta 1 hora antes de cada Zoom (entre 50 y 65 min previos) y 20 minutos antes de cada llamada o tarea.
     * NUNCA prometas enviar mensajes de prueba a una hora arbitraria inventada ("te escribiré a las 23:27") ni pretendas que tienes un cronómetro interno para chatear por iniciativa propia. Las alertas se disparan para las reuniones y tareas registradas en la base de datos del CRM.

RESPONDE SIEMPRE EN FORMATO JSON ESTRICTO:
{
  "intent": "update_lead" | "create_lead" | "general_chat",
  "target_lead_id": "id del lead si se identificó, o null",
  "target_lead_name": "nombre del lead",
  "note_text": "texto de la nota para la bitácora si aplica",
  "next_action_text": "texto de la próxima acción si aplica",
  "next_action_date": "YYYY-MM-DDTHH:mm si aplica",
  "new_status": "prospecto | llamado | cita_agendada | presentacion_realizada | cerrado_ganado | cerrado_perdido si aplica",
  "new_plan": "plan_30 | plan_80 | plan_200 | plan_500 | plan_1200 si aplica",
  "new_value": null,
  "new_lead_data": { "business_name": "", "contact_name": "", "phone": "", "target_plan": "plan_30", "estimated_value": 400 },
  "reply_message": "Tu respuesta detallada y estratégica para Alberto."
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

  // Handle Intent: Update Lead in Supabase
  if (parsed.intent === 'update_lead' && (parsed.target_lead_id || parsed.target_lead_name)) {
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

      if (parsed.note_text) {
        timeline = [{ date: new Date().toISOString(), text: parsed.note_text }, ...timeline];
      }

      const finalNextAction = parsed.next_action_text || currentNextAction;
      const finalNextDate = parsed.next_action_date || currentNextDate;

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

  // Handle Intent: Create Lead in Supabase
  if (parsed.intent === 'create_lead' && parsed.new_lead_data?.contact_name) {
    const d = parsed.new_lead_data;
    const newLeadRecord = {
      contact_name: d.contact_name,
      business_name: d.business_name || d.contact_name,
      phone: d.phone || '',
      target_plan: d.target_plan || 'plan_30',
      estimated_value: d.estimated_value || 400,
      status: 'prospecto',
      assigned_to: 'Alberto Zegarra',
      created_at: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      notes: JSON.stringify({
        timeline: [{ date: new Date().toISOString(), text: 'Prospecto creado vía Copiloto Telegram' }],
        next_action: 'Enviar mensaje de bienvenida y presentación',
        next_action_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
      })
    };

    await supabase.from('leads').insert([newLeadRecord]);
    badgePrefix = `🎉 <b>Nuevo prospecto creado en CRM:</b> <i>${d.contact_name}</i>\n\n`;
  }

  const finalHtml = badgePrefix + formatForTelegramHtml(parsed.reply_message || 'Listo Alberto.');
  return {
    replyText: finalHtml,
    rawReply: parsed.reply_message || 'Listo Alberto.'
  };
}

// -------------------------------------------------------------
// Helper: Send Proactive Reminders (Zoom 60m & Calls 20m)
// -------------------------------------------------------------
export async function checkAndSendReminders() {
  let targetChatId = lastAdminChatId;
  if (!targetChatId) {
    try {
      const { data } = await supabase
        .from('leads')
        .select('notes')
        .eq('business_name', 'SYSTEM_TELEGRAM_SESSION')
        .maybeSingle();

      if (data?.notes) {
        const p = JSON.parse(data.notes);
        if (p.chat_id) targetChatId = p.chat_id;
      }
    } catch (e) {
      console.warn('Error fetching admin chat_id from DB:', e);
    }
  }

  if (!targetChatId) {
    return { status: 'skipped', reason: 'no active admin chat_id found in memory or database' };
  }

  const { data: leads } = await supabase.from('leads').select('*');
  const now = new Date();
  const nowMs = now.getTime();

  let remindersSent = 0;

  for (const l of leads || []) {
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

    const taskTime = new Date(nextActionDate).getTime();
    const diffMinutes = Math.round((taskTime - nowMs) / (60 * 1000));

    const isZoom = nextAction.toLowerCase().includes('zoom') || nextAction.toLowerCase().includes('reunion') || nextAction.toLowerCase().includes('demo');

    let sentThis = false;

    // 1. Zoom alert between 50 and 65 minutes
    if (isZoom && diffMinutes >= 50 && diffMinutes <= 65) {
      const msg = `🚨 <b>¡Recordatorio de Zoom en ~1 hora!</b>\n\n` +
        `👤 <b>Cliente:</b> ${l.contact_name || l.business_name}\n` +
        `⏰ <b>Hora:</b> ${nextActionDate.split('T')[1] || ''}\n` +
        `📝 <b>Detalle:</b> ${nextAction}\n\n` +
        `🎯 <i>Prepárate para abrir la sala y tener la app lista para proyectar.</i>`;
      await sendTelegramMessage(targetChatId, msg);
      remindersSent++;
      sentThis = true;
    }

    // 2. Call/Message alert between 15 and 25 minutes
    if (!isZoom && diffMinutes >= 15 && diffMinutes <= 25) {
      const msg = `⏰ <b>Recordatorio de Tarea en ~20 minutos</b>\n\n` +
        `👤 <b>Cliente:</b> ${l.contact_name || l.business_name}\n` +
        `⏰ <b>Hora:</b> ${nextActionDate.split('T')[1] || ''}\n` +
        `📝 <b>Acción:</b> ${nextAction}\n\n` +
        `📱 <i>Abre WhatsApp o agenda la llamada a tiempo.</i>`;
      await sendTelegramMessage(targetChatId, msg);
      remindersSent++;
      sentThis = true;
    }

    if (sentThis) {
      // Mark as sent in DB to prevent duplicates
      parsedNotes.last_reminder_sent_for = nextActionDate;
      await supabase.from('leads').update({
        notes: JSON.stringify(parsedNotes)
      }).eq('id', l.id);
    }
  }

  return { status: 'ok', remindersSent, targetChatId };
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
