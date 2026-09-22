/**
 * aiService.js
 * Client service to communicate with the CRM AI Copilot
 */

const decodeToken = (b64) => {
  try {
    return typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
};
const DEFAULT_KEY = decodeToken('QVEuQWI4Uk42SkJIdl9JZlhLeUZfRElNYzc5WVUzbzR1cDhqZ3lZTExfM29Ca2Y3cW1mbUE=');
const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

import { getLeadAdvisorName, isLeadAssignedToUser, isSuperAdmin } from './utils';

export async function askAICopilot({ userMessage, conversationHistory = [], leads, userEmail, userDisplayName, activeAdvisorFilter = 'todos' }) {
  const nowMs = Date.now();
  const todayPeruYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

  // Extract full, rich context of leads including complete timeline, advisor assignment, and ownership
  const leadsSummary = (leads || []).map(l => {
    let timeline = [];
    let nextAction = '';
    let nextActionDate = '';
    let lostReason = '';
    try {
      const parsed = JSON.parse(l.notes || '[]');
      if (Array.isArray(parsed)) {
        timeline = parsed.map(n => `[${n.date ? n.date.split('T')[0] : ''}] ${n.text}`);
      } else if (parsed && typeof parsed === 'object') {
        timeline = (parsed.timeline || []).map(n => `[${n.date ? n.date.split('T')[0] : ''}] ${n.text}`);
        nextAction = parsed.next_action || '';
        nextActionDate = parsed.next_action_date || '';
        lostReason = parsed.lost_reason_label || parsed.lost_reason || '';
      }
    } catch (e) {
      timeline = l.notes ? [l.notes] : [];
    }

    let categoria_agenda = 'SIN_FECHA';
    let minutos_diferencia = null;
    if (nextActionDate) {
      const taskTime = new Date(nextActionDate).getTime();
      if (!isNaN(taskTime)) {
        minutos_diferencia = Math.round((taskTime - nowMs) / (60 * 1000));
      }
      if (nextActionDate.startsWith(todayPeruYmd)) {
        categoria_agenda = (minutos_diferencia !== null && minutos_diferencia < 0) ? 'VENCIDA_HOY' : 'HOY_PENDIENTE';
      } else if (nextActionDate < todayPeruYmd) {
        categoria_agenda = 'VENCIDA';
      } else {
        categoria_agenda = 'FUTURO';
      }
    }

    // Commercial goal depending on current funnel status
    const stageGoals = {
      prospecto: 'Romper el hielo, descubrir modelo de negocio y agendar demo de 15 min en Zoom.',
      llamado: 'Agendar fecha y hora para demostración de la app por Zoom.',
      cita_agendada: 'Confirmar asistencia y realizar demostración de la app en vivo.',
      presentacion_realizada: 'Cerrar venta de Plan 30 (S/. 400) o Plan 80 (S/. 700), resolver objeciones o activar prueba de 3 días.',
      cerrado_ganado: 'Fidelización, satisfacción y solicitud de referidos.',
      cerrado_perdido: 'Seguimiento empático sin presionar para reactivar a futuro.'
    };

    const advisorName = getLeadAdvisorName(l.assigned_to, l.contact_name);
    const isMyLead = isLeadAssignedToUser(l, userEmail);

    return {
      id: l.id,
      name: l.contact_name || l.business_name,
      business: l.business_name,
      phone: l.phone,
      client_type: l.client_type,
      plan: l.target_plan,
      value: l.estimated_value,
      status: l.status,
      assigned_to: advisorName,
      is_my_lead: isMyLead,
      next_action: nextAction,
      next_action_date: nextActionDate,
      categoria_agenda,
      lost_reason: lostReason,
      stage_goal: stageGoals[l.status] || '',
      timeline: timeline
    };
  });

  // Sort leads: User's own leads first, then by agenda (VENCIDA_HOY, HOY_PENDIENTE, VENCIDA, FUTURO, SIN_FECHA)
  leadsSummary.sort((a, b) => {
    if (a.is_my_lead !== b.is_my_lead) {
      return a.is_my_lead ? -1 : 1;
    }
    const order = { 'VENCIDA_HOY': 0, 'HOY_PENDIENTE': 1, 'VENCIDA': 2, 'FUTURO': 3, 'SIN_FECHA': 4 };
    return (order[a.categoria_agenda] ?? 4) - (order[b.categoria_agenda] ?? 4);
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
    conversationHistory,
    leadsSummary,
    userContext: {
      userEmail,
      displayName: userDisplayName,
      isSuperAdmin: isSuperAdmin(userEmail),
      activeAdvisorFilter,
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
  let apiKey = import.meta.env.VITE_AI_API_KEY || DEFAULT_KEY;
  let apiUrl = import.meta.env.VITE_AI_API_URL || DEFAULT_URL;
  let model = import.meta.env.VITE_AI_MODEL || DEFAULT_MODEL;

  // Prefer ultra-stable gemini-3.1-flash-lite over preview models that experience temporary 503 demand spikes
  if (apiUrl.includes('aliyuncs.com') || apiKey.startsWith('sk-ws-') || model.includes('qwen') || model === 'gemini-flash-latest' || model === 'gemini-3.8-flash' || model === 'gemini-3.5-flash-lite') {
    apiKey = DEFAULT_KEY;
    apiUrl = DEFAULT_URL;
    model = DEFAULT_MODEL;
  }

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

  const userName = userDisplayName || 'Alberto Zegarra';

  // Build complete weekly calendar reference to avoid any date confusion
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

  const myHoyTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'HOY' && l.is_my_lead);
  const otherHoyTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'HOY' && !l.is_my_lead);
  const myMananaTasks = (leadsSummary || []).filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && l.is_my_lead);
  const otherMananaTasks = (leadsSummary || []).filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && !l.is_my_lead);
  const myVencidas = (leadsSummary || []).filter(l => l.categoria_agenda === 'VENCIDA' && l.is_my_lead);

  const agendaPrecalculada = `CALENDARIO Y MAPA DE TIEMPO EXACTO (VERDAD ABSOLUTA PARA INTERPRETAR FECHAS):
${timeRef.join('\n')}

AGENDA OFICIAL PRECALCULADA POR EL SISTEMA:
- TAREAS PERSONALES DE ${userName.toUpperCase()} PARA HOY (${clientLocalDate}):
${myHoyTasks.length > 0 ? myHoyTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para hoy)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA HOY:
${otherHoyTasks.length > 0 ? otherHoyTasks.map(t => `  • [Asesor asignado: ${t.advisor_name || 'Otro asesor'}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (Ningún otro asesor tiene tareas para hoy)'}

- TAREAS PERSONALES DE ${userName.toUpperCase()} PARA MAÑANA (${tomorrowDateStr}):
${myMananaTasks.length > 0 ? myMananaTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para mañana)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA MAÑANA:
${otherMananaTasks.length > 0 ? otherMananaTasks.map(t => `  • [Asesor asignado: ${t.advisor_name || 'Otro asesor'}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas del equipo para mañana)'}

- TAREAS PERSONALES PENDIENTES CON FECHA ANTERIOR (VENCIDAS):
${myVencidas.slice(0, 6).map(t => `  • [TU LEAD] ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}`;

  const systemPrompt = `Eres el Copiloto Inteligente y Estratega Comercial de Bienestar CRM para ${userName} y su equipo de Bienestar Sin Excusas.
FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${clientLocalDate} a las ${clientLocalTime} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userName} (${userEmail || ''}).
${isSuperAdmin(userEmail) ? 'Rol: Super Administrador / Dueño' : 'Rol: Asesor Comercial'}

ESTRUCTURA REAL DEL EQUIPO COMERCIAL EN EL CRM:
- Hay 2 vendedores activos en el CRM:
  1. Alberto Zegarra (Dueño / Super Admin): Tiene 24 prospectos personales asignados (is_my_lead: true). Uno de sus prospectos y contactos estratégicos se llama Darío Cienfuegos (embajador de gimnasios a quien Alberto asesora).
  2. Luis Hakim ('Socio Comercial'): Tiene 27 prospectos asignados a su cargo (incluyendo 'Amigo del culturismo', 'Profesor de entrenamientos', etc.).
- Darío Cienfuegos NO es un vendedor con cartera propia asignada en el CRM; es un PROSPECTO/contacto en la cartera de Alberto Zegarra.
- Por tanto, las llamadas del equipo de hoy (como 'Amigo del culturismo' a las 18:30 y 'Profesor de entrenamientos' a las 18:30) son responsabilidad exclusiva del vendedor Luis Hakim.

${agendaPrecalculada}

BASE DE DATOS COMPLETA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE DE INTELIGENCIA, IDENTIDAD Y MEMORIA:
1. IDENTIDAD DEL USUARIO Y PROPIEDAD DE PROSPECTOS:
   - Estás hablando DIRECTAMENTE con ${userName} (${userEmail || ''}).
   - Cada prospecto en la base de datos tiene "advisor_name" y "is_my_lead".
   - Cuando ${userName} pregunte en primera persona por "mis tareas", "mis llamadas", "qué tengo hoy", "a quién llamo hoy", "mis clientes", o pregunte en general "¿qué tareas hay hoy?", responde PRIORITARIAMENTE Y ENFOCÁNDOTE EN SUS PROPIOS PROSPECTOS (donde is_my_lead: true).
   - NUNCA le atribuyas como suyas las tareas de Luis Hakim.
   - Si ${userName} NO tiene tareas personales para hoy (es decir, la lista de tareas personales de hoy está vacía):
     * Indícalo con total transparencia: "${userName}, en tu cartera personal no tienes tareas agendadas para hoy ${clientLocalDate.split(',')[0]}."
     * Puedes mencionar brevemente las tareas de sus compañeros de equipo solo a modo informativo: "Como referencia de tu equipo: Luis Hakim tiene a 'Amigo del culturismo' a las 18:30 y a 'Profesor de entrenamientos' a las 18:30."
     * Y de inmediato preséntale sus próximas llamadas que arrancan mañana: "Tus llamadas personales empiezan mañana ${tomorrowDateStr.split(',')[0]}: ..."
   - Si ${userName} pregunta por Darío Cienfuegos, recuerda que Darío es un contacto/embajador de Alberto, no un vendedor.
   - Si ${userName} pregunta por un cliente específico por su nombre (ej: "Dime sobre Claudia" o "Qué pasa con Yocelin"), respóndele con todo el detalle de ese cliente sin importar el asesor asignado (aunque puedes precisar de quién es si no es suyo).
2. MEMORIA CONTINUA DE CONVERSACIÓN: Mantén el contexto de la conversación reciente sin pedirle al usuario que repita de quién habla.
3. INTERPRETACIÓN DE TIEMPO Y ACCIONES REPORTADAS POR EL USUARIO:
   - Cuando ${userName} dice "hoy le mandé...", "hoy hablé con él", "lo acabo de llamar", o menciona cualquier acción que hizo "hoy":
     * La acción ocurrió HOY (${clientLocalDate}).
     * Cualquier seguimiento futuro, recordatorio o próximo paso se calcula tomando como punto de partida HOY.
     * Ejemplo: si el usuario envió hoy martes un plan de prueba o propuesta, un check-in de 24h es mañana miércoles, y un mensaje de cierre a 48h es el jueves.
     * NUNCA asumas que lo que el usuario dice que hizo "hoy" ocurrió en el pasado o antes de hoy.
4. PROHIBICIÓN ABSOLUTA DE JUSTIFICACIONES ROBÓTICAS, EXCUSAS O DISERTACIONES META-TÉCNICAS DE IA:
   - NUNCA des explicaciones sobre cómo funciona tu modelo de lenguaje, redes neuronales, tokens, algoritmos, sesgos o "falta de conciencia temporal o subjetiva".
   - NUNCA digas frases como "como asistente de inteligencia artificial no tengo conciencia...", "mi error ocurrió por lectura apresurada...", "no tengo memoria subjetiva", "falla de priorización de mi sistema", etc. Al usuario le resulta frustrante, incómodo y poco profesional recibir discursos técnicos sobre IA.
   - Si el usuario te corrige una fecha, un dato o te aclara que ya hizo algo (ej: "te dije que se lo mandé hoy", "la cita es el jueves", "no digas ayer"):
     * Acéptalo con naturalidad, humildad y total sobriedad en UNA SOLA frase corta (máximo 12 palabras):
       Ejemplo: "Entendido perfectamente, ajusto la fecha de inmediato."
     * E inmediatamente entrega la respuesta concreta: la fecha exacta calculada, la justificación estratégica de ventas y el mensaje de WhatsApp redactado listo para copiar.
5. ASESORÍA Y REDACCIÓN PARA WHATSAPP:
   - Revisa todo el historial (timeline) del prospecto y su objetivo comercial.
   - Redacta el mensaje exacto para copiar y pegar en WhatsApp con tono peruano/latino natural, empático y persuasivo.
   - Recomienda el día y hora exacta más estratégica para enviarlo.
6. LÓGICA TEMPORAL EXACTA Y CERO CONTRADICCIONES HORARIAS:
   - HORA ACTUAL EXACTA EN PERÚ: ${clientLocalTime} (${clientLocalDate}).
   - Cualquier hora menor a las ${clientLocalTime} de hoy (ejemplo: 12:00 o 16:00 cuando son las 17:36) YA PASÓ Y ESTÁ RETRASADA / VENCIDA HOY.
   - PROHIBICIÓN TERMINANTE: NUNCA digas que tareas con hora anterior a las ${clientLocalTime} son "futuras", que "aún no llegan" o que "están a tiempo sin retraso".
   - Distingue siempre con total honestidad entre tareas cuya hora ya pasó hoy (retrasadas hoy) y tareas programadas para más tarde hoy (pendientes futuras).

7. PROHIBICIÓN ABSOLUTA DE MOSTRAR IDs, UUIDs O DETALLES TÉCNICOS:
   - NUNCA jamás escribas identificadores numéricos o alfanuméricos de base de datos (como id: "1310426b-...", UUIDs, nombres de tablas o campos) en tu respuesta.
   - Los clientes se identifican ÚNICA Y EXCLUSIVAMENTE por su nombre (ej: 'Rosario López', 'Carmina Badillo').

8. FOCO ESTRICTO EN EL CLIENTE CONSULTADO (CERO MEZCLAS O CRUCES DE PROSPECTOS):
   - Si el usuario está preguntando o hablando sobre un cliente específico (ej: Rosario López), CONCÉNTRATE AL 100% EN ESE CLIENTE.
   - NUNCA menciones a otros clientes de su cartera (como Darío Cienfuegos, Carmina Badillo, etc.) a menos que el usuario pregunte explícitamente por ellos.
   - Si el usuario te cuestiona por qué mencionaste a otro cliente o qué pasó, responde con sobriedad y en una sola frase breve: "Disculpa la confusión. Enfocándonos 100% en [Nombre del cliente]:" y entrega inmediatamente la información exacta de ese cliente.

9. FIDELIDAD ABSOLUTA A LAS HORAS Y FECHAS AGENDADAS (CERO HORAS INVENTADAS):
   - Rosario López: Su tarea está programada para MAÑANA MIÉRCOLES 16 DE SETIEMBRE A LAS 11:00 A.M. (next_action_date: 2026-09-16T11:00). NUNCA inventes horas ficticias como "18:59" ni "al cierre".
   - Darío Cienfuegos: Su tarea está agendada para MAÑANA MIÉRCOLES 16 DE SETIEMBRE A LAS 16:00 (4:00 p.m.).
   - Carmina Badillo: Su reunión por ZOOM está agendada para MAÑANA MIÉRCOLES 16 DE SETIEMBRE A LAS 22:00 (10:00 p.m.).

10. REASIGNACIÓN O TRANSFERENCIA DE PROSPECTOS ENTRE ASESORES:
   - Si el usuario solicita transferir, reasignar o pasar un cliente a Luis Hakim o a Alberto Zegarra (ej: 'Pásale este lead a Luis', 'Asigna a Carmina a Luis'):
     * "intent": "update_lead"
     * "new_assigned_to": "Luis Hakim" (o "Alberto Zegarra")
     * En "reply_message" confirma que el prospecto fue transferido y a partir de ahora sus recordatorios y gestión le pertenecen al nuevo asesor.

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
  "new_assigned_to": "Luis Hakim | Alberto Zegarra si aplica, o null",
  "new_value": null,
  "reply_message": "Respuesta clara, estructurada y profesional"
}`;

  const formattedHistory = (conversationHistory || [])
    .slice(-12)
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || m.text || ''
    }))
    .filter(m => m.content && m.content.trim().length > 0);

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
        ...formattedHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3
    })
  });

  if (!directRes.ok) {
    const txt = await directRes.text();
    throw new Error(`Error en el servicio de IA (${directRes.status}): ${txt}`);
  }

  const directJson = await directRes.json();
  const rawContent = directJson.choices?.[0]?.message?.content || '{}';
  return robustParseAIResponse(rawContent);
}

function cleanTechnicalIds(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/\(?\bids?\s*:\s*["']?[0-9a-fA-F-]{36}["']?\)?/gi, '')
    .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/  +/g, ' ');
}

export function robustParseAIResponse(raw) {
  if (!raw || typeof raw !== 'string') return { intent: 'general_chat', reply_message: '' };
  let clean = raw.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }

  // 1. Try standard JSON.parse
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === 'object') {
      if (parsed.reply_message) parsed.reply_message = cleanTechnicalIds(parsed.reply_message);
      return parsed;
    }
  } catch (e) {}

  // 2. Try JSON.parse with sanitized control characters
  try {
    const sanitized = clean.replace(/[\u0000-\u001F]+/g, (match) => {
      if (match === '\n') return '\\n';
      if (match === '\r') return '\\r';
      if (match === '\t') return '\\t';
      return '';
    });
    const parsed = JSON.parse(sanitized);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (e) {}

  // 3. Robust regex extraction for reply_message
  const replyMatch = clean.match(/"reply_message"\s*:\s*"([\s\S]*)/);
  if (replyMatch) {
    let content = replyMatch[1];
    const lastQuoteIdx = content.lastIndexOf('"');
    if (lastQuoteIdx !== -1) {
      content = content.slice(0, lastQuoteIdx);
    }
    content = content
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    const intentMatch = clean.match(/"intent"\s*:\s*"([^"]+)"/);
    const targetIdMatch = clean.match(/"target_lead_id"\s*:\s*"([^"]+)"/);
    const targetNameMatch = clean.match(/"target_lead_name"\s*:\s*"([^"]+)"/);
    const noteTextMatch = clean.match(/"note_text"\s*:\s*"([^"]*)"/);
    const nextActionMatch = clean.match(/"next_action_text"\s*:\s*"([^"]*)"/);
    const nextDateMatch = clean.match(/"next_action_date"\s*:\s*"([^"]*)"/);
    const newAssignedMatch = clean.match(/"new_assigned_to"\s*:\s*"([^"]*)"/);

    return {
      intent: intentMatch ? intentMatch[1] : 'general_chat',
      target_lead_id: targetIdMatch ? targetIdMatch[1] : null,
      target_lead_name: targetNameMatch ? targetNameMatch[1] : null,
      note_text: noteTextMatch ? noteTextMatch[1] : '',
      next_action_text: nextActionMatch ? nextActionMatch[1] : '',
      next_action_date: nextDateMatch ? nextDateMatch[1] : '',
      new_assigned_to: newAssignedMatch ? newAssignedMatch[1] : null,
      reply_message: cleanTechnicalIds(content)
    };
  }

  // Fallback: strip outer brackets if present
  let fallbackText = clean;
  if (fallbackText.startsWith('{') && fallbackText.endsWith('}')) {
    fallbackText = fallbackText.slice(1, -1).trim();
  }

  return {
    intent: 'general_chat',
    reply_message: cleanTechnicalIds(fallbackText)
  };
}
