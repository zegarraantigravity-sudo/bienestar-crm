/**
 * aiService.js
 * Client service to communicate with the CRM AI Copilot
 */

const DEFAULT_KEY = 'sk-ws-H.DMLLELE.Ns7U.MEQCIEQeFcXistPzyFJ3JaFIfIwVAvEaxrfhN9E8et6HLLadAiAOEVqQ8dMN1M0bBuZEUdsC-hotw6l_Fm5LUUJ8gR9FOw';
const DEFAULT_URL = 'https://ws-4obirdagiy942cl5.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus';

export async function askAICopilot({ userMessage, conversationHistory = [], leads, userEmail, userDisplayName }) {
  const todayPeruYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

  // Extract full, rich context of leads including complete timeline and business stage
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

    // Commercial goal depending on current funnel status
    const stageGoals = {
      prospecto: 'Romper el hielo, descubrir modelo de negocio y agendar demo de 15 min en Zoom.',
      llamado: 'Agendar fecha y hora para demostración de la app por Zoom.',
      cita_agendada: 'Confirmar asistencia y realizar demostración de la app en vivo.',
      presentacion_realizada: 'Cerrar venta de Plan 30 (S/. 400) o Plan 80 (S/. 700), resolver objeciones o activar prueba de 3 días.',
      cerrado_ganado: 'Fidelización, satisfacción y solicitud de referidos.',
      cerrado_perdido: 'Seguimiento empático sin presionar para reactivar a futuro.'
    };

    return {
      id: l.id,
      name: l.contact_name || l.business_name,
      business: l.business_name,
      phone: l.phone,
      client_type: l.client_type,
      plan: l.target_plan,
      value: l.estimated_value,
      status: l.status,
      assigned_to: l.assigned_to,
      next_action: nextAction,
      next_action_date: nextActionDate,
      categoria_agenda,
      lost_reason: lostReason,
      stage_goal: stageGoals[l.status] || '',
      timeline: timeline
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
    conversationHistory,
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

  const systemPrompt = `Eres el Copiloto Inteligente y Estratega Comercial de Bienestar CRM para Alberto Zegarra y su equipo de Bienestar Sin Excusas.
FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${clientLocalDate} a las ${clientLocalTime} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userDisplayName || 'Alberto Zegarra'} (${userEmail || ''}).

${agendaPrecalculada}

BASE DE DATOS COMPLETA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE DE INTELIGENCIA Y MEMORIA:
1. MEMORIA CONTINUA DE CONVERSACIÓN: Mantén el contexto de la conversación reciente sin pedirle a Alberto que repita de quién habla.
2. ASESORÍA Y REDACCIÓN PARA WHATSAPP:
   - Revisa todo el historial (timeline) del prospecto y su objetivo comercial.
   - Redacta el mensaje exacto para copiar y pegar en WhatsApp con tono peruano/latino natural, empático y persuasivo.
   - Recomienda el día y hora exacta más estratégica para enviarlo.
3. REGLA ESTRICTA DE HOY:
   - Para tareas de HOY menciona única y exclusivamente los que tienen categoria_agenda "HOY".
   - Tareas de mañana ponlas claramente en una sección separada abajo.

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

    return {
      intent: intentMatch ? intentMatch[1] : 'general_chat',
      target_lead_id: targetIdMatch ? targetIdMatch[1] : null,
      target_lead_name: targetNameMatch ? targetNameMatch[1] : null,
      note_text: noteTextMatch ? noteTextMatch[1] : '',
      next_action_text: nextActionMatch ? nextActionMatch[1] : '',
      next_action_date: nextDateMatch ? nextDateMatch[1] : '',
      reply_message: content
    };
  }

  // Fallback: strip outer brackets if present
  let fallbackText = clean;
  if (fallbackText.startsWith('{') && fallbackText.endsWith('}')) {
    fallbackText = fallbackText.slice(1, -1).trim();
  }

  return {
    intent: 'general_chat',
    reply_message: fallbackText
  };
}
