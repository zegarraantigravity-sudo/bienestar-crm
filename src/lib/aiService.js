/**
 * aiService.js
 * Client service to communicate with the CRM AI Copilot
 */

const DEFAULT_KEY = 'sk-ws-H.DMLLELE.Ns7U.MEQCIEQeFcXistPzyFJ3JaFIfIwVAvEaxrfhN9E8et6HLLadAiAOEVqQ8dMN1M0bBuZEUdsC-hotw6l_Fm5LUUJ8gR9FOw';
const DEFAULT_URL = 'https://ws-4obirdagiy942cl5.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus';

export async function askAICopilot({ userMessage, leads, userEmail, userDisplayName }) {
  // Extract a lightweight, essential summary of leads to send to the AI
  const leadsSummary = (leads || []).map(l => {
    let lastNotes = [];
    let nextAction = '';
    let nextActionDate = '';
    try {
      const parsed = JSON.parse(l.notes || '[]');
      if (Array.isArray(parsed)) {
        lastNotes = parsed.slice(0, 3).map(n => `[${n.date ? n.date.split('T')[0] : ''}] ${n.text}`);
      } else if (parsed && typeof parsed === 'object') {
        lastNotes = (parsed.timeline || []).slice(0, 3).map(n => `[${n.date ? n.date.split('T')[0] : ''}] ${n.text}`);
        nextAction = parsed.next_action || '';
        nextActionDate = parsed.next_action_date || '';
      }
    } catch (e) {
      lastNotes = l.notes ? [l.notes] : [];
    }

    const todayPeruYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
    let categoria_agenda = 'SIN_FECHA';
    if (nextActionDate) {
      const datePart = nextActionDate.split('T')[0];
      if (datePart === todayPeruYmd) {
        categoria_agenda = 'HOY';
      } else if (datePart < todayPeruYmd) {
        categoria_agenda = 'VENCIDA';
      } else {
        categoria_agenda = 'FUTURO';
      }
    }

    return {
      id: l.id,
      name: l.contact_name || l.business_name,
      business: l.business_name,
      phone: l.phone,
      plan: l.target_plan,
      value: l.estimated_value,
      status: l.status,
      assigned_to: l.assigned_to,
      next_action: nextAction,
      next_action_date: nextActionDate,
      categoria_agenda,
      recent_notes: lastNotes
    };
  });

  // Sort leads: HOY first, then FUTURO, then VENCIDA, then SIN_FECHA
  leadsSummary.sort((a, b) => {
    const order = { 'HOY': 0, 'FUTURO': 1, 'VENCIDA': 2, 'SIN_FECHA': 3 };
    return (order[a.categoria_agenda] ?? 3) - (order[b.categoria_agenda] ?? 3);
  });

  const nowPeru = new Date();
  const clientLocalDate = nowPeru.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const clientLocalTime = nowPeru.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit'
  });

  const payload = {
    userMessage,
    leadsSummary,
    userContext: {
      userEmail,
      displayName: userDisplayName,
      clientLocalDate,
      clientLocalTime
    }
  };

  // Try calling the Vercel serverless endpoint /api/chat
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.warn('/api/chat responded with status:', res.status, errorData);
    }
  } catch (err) {
    console.warn('Network error reaching /api/chat, testing direct fallback:', err);
  }

  // Fallback: direct call with apiKey
  const apiKey = import.meta.env.VITE_AI_API_KEY || DEFAULT_KEY;
  const apiUrl = import.meta.env.VITE_AI_API_URL || DEFAULT_URL;
  const model = import.meta.env.VITE_AI_MODEL || DEFAULT_MODEL;

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

  const hoyTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'HOY');
  const mananaTasks = (leadsSummary || []).filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd));
  const vencidasTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'VENCIDA');

  const agendaPrecalculada = `CALENDARIO Y AGENDA OFICIAL PRECALCULADA POR EL SISTEMA (VERDAD ABSOLUTA):
- Tareas programadas estrictamente para HOY (${clientLocalDate}):
${hoyTasks.length > 0 ? hoyTasks.map(t => `  • ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas programadas para hoy)'}

- Tareas programadas para MAÑANA (${tomorrowDateStr}):
${mananaTasks.length > 0 ? mananaTasks.map(t => `  • ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas programadas para mañana)'}

- Tareas pendientes con fecha anterior (VENCIDAS):
${vencidasTasks.slice(0, 6).map(t => `  • ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}`;

  const systemPrompt = `Eres el Copiloto Inteligente de Bienestar CRM para Alberto Zegarra y su equipo comercial de Bienestar Sin Excusas.
FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${clientLocalDate} a las ${clientLocalTime} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userDisplayName || 'Alberto Zegarra'} (${userEmail || ''}).

${agendaPrecalculada}

TIENES ACCESO A LA LISTA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. TEN MUCHO CUIDADO CON LAS FECHAS Y DÍAS:
   - La fecha actual en Perú es EXACTAMENTE: ${clientLocalDate}.
   - Si hoy es ${clientLocalDate.split(',')[0]}, mañana es ${tomorrowDateStr.split(',')[0]}.
2. REGLA ESTRICTA PARA PREGUNTAS DE TAREAS ("¿Qué tareas o llamadas tengo para hoy?"):
   - Guíate DIRECTAMENTE por la sección "Tareas programadas estrictamente para HOY" del bloque precalculado.
   - Para las tareas de HOY: menciona ÚNICA Y EXCLUSIVAMENTE los prospectos programados para HOY.
   - NUNCA incluyas a un prospecto de MAÑANA (como Claudia Advincula u Oscar Fara) dentro de las tareas de hoy.
   - NUNCA digas cosas como "hoy no hay llamada pero debes prepararla". Si su fecha es mañana, es para mañana.
   - Si deseas mencionar tareas futuras, ponlas abajo en una sección claramente separada: "📅 Para mañana (${tomorrowDateStr.split(',')[0]}):".
3. Si el usuario te pide registrar una nota, llamada o acordar una cita/tarea:
   - Identifica a qué prospecto se refiere (por nombre, empresa o aproximación).
   - Extrae la nota a agregar en la bitácora.
   - Extrae la próxima acción y calcula la fecha y hora exacta en formato YYYY-MM-DDTHH:mm.
   - Establece "intent": "update_lead".
4. Si el usuario pide un resumen o información de un cliente (ej: "¿quién es Noé?", "resumen de Noé Rojas"):
   - Responde con datos precisos de su historial, teléfono, plan, valor estimado y próximas acciones. Sé conciso y directo.
   - Establece "intent": "general_chat".

RESPONDE SIEMPRE EN FORMATO JSON ESTRICTO:
{
  "intent": "update_lead" | "create_lead" | "general_chat",
  "target_lead_id": "id del lead si aplica",
  "target_lead_name": "nombre del lead si aplica",
  "note_text": "texto de la nota para la bitacora",
  "next_action_text": "texto de la proxima accion",
  "next_action_date": "YYYY-MM-DDTHH:mm",
  "new_status": "estado nuevo si aplica",
  "new_plan": "plan nuevo si aplica",
  "new_value": null,
  "reply_message": "Respuesta clara y profesional"
}`;

  const directRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2
    })
  });

  if (!directRes.ok) {
    const txt = await directRes.text();
    throw new Error(`Error en el servicio de IA (${directRes.status}): ${txt}`);
  }

  const directJson = await directRes.json();
  const rawContent = directJson.choices?.[0]?.message?.content || '{}';
  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    return {
      intent: 'general_chat',
      reply_message: rawContent
    };
  }
}
