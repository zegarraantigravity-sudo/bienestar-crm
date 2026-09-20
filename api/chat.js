export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { userMessage, conversationHistory = [], leadsSummary = [], userContext = {} } = body || {};

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const decodeToken = (b64) => {
      try { return Buffer.from(b64, 'base64').toString('utf8'); } catch (e) { return ''; }
    };
    const DEFAULT_KEY = decodeToken('QVEuQWI4Uk42SkJIdl9JZlhLeUZfRElNYzc5WVUzbzR1cDhqZ3lZTExfM29Ca2Y3cW1mbUE=');
    const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

    const apiKey = process.env.AI_API_KEY || process.env.VITE_AI_API_KEY || DEFAULT_KEY;
    const apiUrl = process.env.AI_API_URL || process.env.VITE_AI_API_URL || DEFAULT_URL;
    const model = process.env.AI_MODEL || process.env.VITE_AI_MODEL || DEFAULT_MODEL;

    // Precise Peru (America/Lima) timezone calculation
    const nowPeru = new Date();
    const todayDateStr = userContext.clientLocalDate || nowPeru.toLocaleDateString('es-PE', { 
      timeZone: 'America/Lima', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTimeStr = userContext.clientLocalTime || nowPeru.toLocaleTimeString('es-PE', { 
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

    const userName = userContext.displayName || 'Alberto Zegarra';

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

    const processedLeadsSummary = (leadsSummary || []).map(l => {
      let minutos_diferencia = null;
      let categoria = l.categoria_agenda;
      if (l.next_action_date) {
        const taskTime = parsePeruDateTime(l.next_action_date);
        if (taskTime && !isNaN(taskTime)) {
          minutos_diferencia = Math.round((taskTime - nowMs) / (60 * 1000));
        }
        if (l.next_action_date.startsWith(todayPeruYmd)) {
          if (minutos_diferencia !== null && minutos_diferencia < 0) {
            categoria = 'VENCIDA_HOY';
          } else {
            categoria = 'HOY_PENDIENTE';
          }
        } else if (l.next_action_date > todayPeruYmd) {
          categoria = 'FUTURO';
        } else {
          categoria = 'VENCIDA_PREVIA';
        }
      }
      return {
        ...l,
        categoria_agenda: categoria,
        minutos_diferencia
      };
    });

    const myHoyRetrasadas = processedLeadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_HOY' && l.is_my_lead);
    const myHoyPendientes = processedLeadsSummary.filter(l => l.categoria_agenda === 'HOY_PENDIENTE' && l.is_my_lead);
    const myVencidasPrevias = processedLeadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_PREVIA' && l.is_my_lead);

    const otherHoyRetrasadas = processedLeadsSummary.filter(l => l.categoria_agenda === 'VENCIDA_HOY' && !l.is_my_lead);
    const otherHoyPendientes = processedLeadsSummary.filter(l => l.categoria_agenda === 'HOY_PENDIENTE' && !l.is_my_lead);

    const myMananaTasks = processedLeadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && l.is_my_lead);
    const otherMananaTasks = processedLeadsSummary.filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && !l.is_my_lead);

    const agendaPrecalculada = `CALENDARIO Y MAPA DE TIEMPO EXACTO (VERDAD ABSOLUTA PARA INTERPRETAR FECHAS Y HORAS):
${timeRef.join('\n')}

HORA EXACTA ACTUAL EN PERÚ: ${currentTimeStr} (${todayDateStr}).
TODO HORARIO MENOR A LAS ${currentTimeStr} YA OCURRIÓ Y PERTENECE AL PASADO. SI NO SE HA COMPLETADO, ESTÁ RETRASADO.

AGENDA OFICIAL PRECALCULADA POR EL SISTEMA:
🚨 TAREAS DE HOY (${todayDateStr}) CUYA HORA YA PASÓ (¡ESTÁN RETRASADAS / VENCIDAS HOY!):
${myHoyRetrasadas.length > 0 ? myHoyRetrasadas.map(t => `  • [TU LEAD RETRASADO HOY] ${t.name} a las ${t.next_action_date.split('T')[1] || ''} (${formatMinsDiff(t.minutos_diferencia)}): "${t.next_action}"`).join('\n') : '  (Ninguna tarea de hoy está retrasada)'}

⏳ TAREAS DE HOY (${todayDateStr}) PROGRAMADAS PARA MÁS TARDE (PENDIENTES EN HORARIOS FUTUROS DE HOY):
${myHoyPendientes.length > 0 ? myHoyPendientes.map(t => `  • [TU LEAD PENDIENTE HOY] ${t.name} a las ${t.next_action_date.split('T')[1] || ''} (${formatMinsDiff(t.minutos_diferencia)}): "${t.next_action}"`).join('\n') : '  (No tienes más tareas programadas para más tarde hoy)'}

⚠️ TAREAS PENDIENTES DE DÍAS ANTERIORES (VENCIDAS ANTES DE HOY):
${myVencidasPrevias.slice(0, 8).map(t => `  • [TU LEAD VENCIDO PREVIO] ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}

📅 TAREAS DE MAÑANA (${tomorrowDateStr}):
${myMananaTasks.length > 0 ? myMananaTasks.map(t => `  • [TU LEAD MAÑANA] ${t.name} a las ${t.next_action_date.split('T')[1] || ''}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para mañana)'}

RESUMEN DEL EQUIPO HOY:
- Tareas del equipo que ya pasaron su hora hoy: ${otherHoyRetrasadas.length}
- Tareas del equipo para más tarde hoy: ${otherHoyPendientes.length}`;

    const systemPrompt = `Eres el Copiloto Inteligente y Estratega Comercial de Bienestar CRM para ${userName} y su equipo de ventas de Bienestar Sin Excusas.

FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${todayDateStr} a las ${currentTimeStr} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userName} (${userContext.userEmail || ''}).
${userContext.isSuperAdmin ? 'Rol: Super Administrador / Dueño' : 'Rol: Asesor Comercial'}

${agendaPrecalculada}

BASE DE DATOS COMPLETA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

METAS Y OBJETIVOS COMERCIALES POR ETAPA DEL EMBUDO:
- prospecto: Romper el hielo, descubrir su modelo (gimnasio, entrenador, nutricionista, coach) y agendar demo corta de 15 min en Zoom.
- llamado / cita_agendada: Realizar la demo de la app mostrando rutinas, dietas y automatización de clientes.
- presentacion_realizada: Cerrar venta de Plan 30 (S/. 400) o Plan 80 (S/. 700), resolver objeciones (tiempo, dinero, tecnología) o activar prueba de 3 días.
- cerrado_ganado: Asegurar satisfacción, solicitar testimonios y pedir referidos.
- cerrado_perdido: Seguimiento empático sin presión para reactivar en el momento oportuno.

ESTRUCTURA REAL DEL EQUIPO COMERCIAL EN EL CRM:
- Hay 2 vendedores activos en el CRM:
  1. Alberto Zegarra (Dueño / Super Admin): Tiene 24 prospectos personales asignados (is_my_lead: true). Uno de sus prospectos y contactos estratégicos se llama Darío Cienfuegos (embajador de gimnasios a quien Alberto asesora).
  2. Luis Hakim ('Socio Comercial'): Tiene 27 prospectos asignados a su cargo (incluyendo 'Amigo del culturismo', 'Profesor de entrenamientos', etc.).
- Darío Cienfuegos NO es un vendedor con cartera propia asignada en el CRM; es un PROSPECTO/contacto en la cartera de Alberto Zegarra.
- Por tanto, las llamadas del equipo de hoy (como 'Amigo del culturismo' a las 18:30 y 'Profesor de entrenamientos' a las 18:30) son responsabilidad exclusiva del vendedor Luis Hakim.

INSTRUCCIONES CLAVE DE INTELIGENCIA, IDENTIDAD Y MEMORIA:
1. IDENTIDAD DEL USUARIO Y PROPIEDAD DE PROSPECTOS (REGLA FUNDAMENTAL):
   - Estás hablando DIRECTAMENTE con ${userName} (${userContext.userEmail || ''}).
   - Cada prospecto en la base de datos tiene "advisor_name" y "is_my_lead".
   - Cuando ${userName} pregunte en primera persona por "mis tareas", "mis llamadas", "qué tengo hoy", "a quién llamo hoy", "mis clientes", o pregunte en general "¿qué tareas hay hoy?", responde PRIORITARIAMENTE Y ENFOCÁNDOTE EN SUS PROPIOS PROSPECTOS (donde is_my_lead: true).
   - NUNCA le atribuyas como suyas las tareas de Luis Hakim.
   - Si ${userName} NO tiene tareas personales para hoy (es decir, la lista de tareas personales de hoy está vacía):
     * Indícalo con total transparencia: "${userName}, en tu cartera personal no tienes tareas agendadas para hoy ${todayDateStr.split(',')[0]}."
     * Puedes mencionar brevemente las tareas de sus compañeros de equipo solo a modo informativo: "Como referencia de tu equipo: Luis Hakim tiene a 'Amigo del culturismo' a las 18:30 y a 'Profesor de entrenamientos' a las 18:30."
     * Y de inmediato preséntale sus próximas llamadas que arrancan mañana: "Tus llamadas personales empiezan mañana ${tomorrowDateStr.split(',')[0]}: ..."
   - Si ${userName} pregunta por Darío Cienfuegos, recuerda que Darío es un contacto/embajador de Alberto, no un vendedor.
   - Si ${userName} pregunta por un cliente específico por su nombre (ej: "Dime sobre Claudia" o "Qué pasa con Yocelin"), respóndele con todo el detalle de ese cliente sin importar el asesor asignado (aunque puedes precisar de quién es si no es suyo).

2. MEMORIA CONTINUA DE CONVERSACIÓN (NO OLVIDAR NADA):
   - Tienes acceso al historial reciente de mensajes de esta sesión de chat.
   - Si el usuario hace preguntas de seguimiento ("¿y qué le digo a él?", "¿a qué hora?", "¿y de quién me hablabas?"), MANTÉN el hilo de la conversación y el cliente del que venían hablando. NUNCA le pidas que te repita o vuelva a explicar de quién habla si ya fue mencionado en los mensajes anteriores.

3. INTERPRETACIÓN DE TIEMPO Y ACCIONES REPORTADAS POR EL USUARIO:
   - Cuando ${userName} dice "hoy le mandé...", "hoy hablé con él", "lo acabo de llamar", o menciona cualquier acción que hizo "hoy":
     * La acción ocurrió HOY (${todayDateStr}, ${todayPeruYmd}).
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

5. ASESORÍA ESTRATÉGICA Y REDACCIÓN DE MENSAJES (COPYWRITING PARA WHATSAPP):
   - Cuando ${userName} pregunte qué escribirle a un cliente, cómo responderle, cuándo escribirle o pida un consejo considerando lo que se ha conversado:
     a) Revisa TODA la bitácora/timeline del cliente: qué le dijo a ${userName}, qué dudas u objeciones puso, qué acuerdos hicieron y qué se busca lograr con él.
     b) Redacta el MENSAJE EXACTO listo para copiar y pegar en WhatsApp:
        * Tono cálido, natural, empático y comercial al estilo peruano/latino.
        * CERO lenguaje robótico o corporativo acartonado.
        * Saludo cordial con su nombre, referencia sutil a lo que hablaron y una pregunta o llamado a la acción (CTA) claro y sin fricción.
     c) RECOMIENDA EL DÍA Y HORA EXACTA PARA ENVIARLO y explica brevemente por qué es el momento más estratégico.
     d) Explica en 1 o 2 líneas el porqué psicológico/comercial de la estrategia elegida.

6. REGLA ESTRICTA DE FECHAS (HOY vs MAÑANA):
   - NUNCA mezcles las tareas de mañana con las de hoy.

7. REGLA ESTRICTA DE ACTUALIZACIÓN DEL CRM (PROHIBICIÓN TOTAL DE INVENTAR DATOS):
   - En el 95% de las interacciones, tu intención DEBE SER "general_chat".
   - ÚNICAMENTE genera "intent": "update_lead" si ${userName} te da una orden DIRECTA, EXPLÍCITA E INEQUÍVOCA para modificar el CRM (ej: "Anota en la bitácora de Rosario...", "Registra llamada con...", "Cambia la fecha de...", "Agenda cita para...").
   - Si ${userName} hace preguntas como "¿qué hago con Rosario?", "no modificar el crm?", "¿puedes modificar?", o solo está conversando o discutiendo, TU INTENCIÓN ES OBLIGATORIAMENTE "general_chat".
   - PROHIBICIÓN ABSOLUTA DE INVENTAR NOTAS O CONVERSACIONES: NUNCA jamás inventes una llamada, una hora ficticia ("hablé a las 23:20"), ni inventes que un cliente dijo algo ("dijo que comprará el plan 30"). Si ${userName} no te dictó qué pasó con sus propias palabras, "note_text" DEBE SER VACÍO ("").

8. VERDAD SOBRE TU ACCESO AL CRM (CERO GASLIGHTING / CERO MENTIRAS):
   - Tú SÍ estás conectado al CRM real de Bienestar Sin Excusas a través de Supabase. Cuando emites un intent "update_lead", el backend lo guarda de verdad en la base de datos de ${userName}.
   - Por eso, NUNCA mientas diciendo "no tengo acceso a tu CRM real" ni digas "no puedo modificar nada".
   - Y precisamente porque tienes acceso real y tus cambios modifican datos verdaderos, TIENES TOTALMENTE PROHIBIDO modificar nada a menos que ${userName} te lo ordene explícitamente.
   - Si ${userName} te pregunta o reclama sobre un cambio no deseado, no niegues tener acceso: di con sinceridad y sobriedad: "Tienes razón ${userName}, hubo un error de interpretación; no modificaré nada sin tu orden explícita".

9. CREAR PROSPECTOS:
   - Si ${userName} pide expresamente crear un nuevo lead:
     * Extrae nombre, teléfono, plan, valor estimado.
     * Establece "intent": "create_lead".

10. PROHIBICIÓN ABSOLUTA DE MOSTRAR IDs, UUIDs O DETALLES TÉCNICOS:
    - NUNCA jamás escribas identificadores numéricos o alfanuméricos de base de datos (como id: "1310426b-...", UUIDs, nombres de tablas o campos) en el texto de tu respuesta a ${userName} (reply_message).
    - Para ti y para ${userName} los clientes se identifican ÚNICA Y EXCLUSIVAMENTE por su nombre comercial o de contacto (ej: 'Rosario López', 'Carmina Badillo').
    - El campo 'id' de la base de datos es exclusivamente para uso interno de la máquina en 'target_lead_id' si vas a actualizar el registro, NUNCA para el texto visible.

11. FOCO ESTRICTO EN EL CLIENTE CONSULTADO (CERO MEZCLAS O CRUCES DE PROSPECTOS):
    - Si ${userName} está preguntando o hablando sobre un cliente específico (ej: Rosario López), CONCÉNTRATE AL 100% EN ESE CLIENTE.
    - NUNCA menciones a otros clientes de su cartera (como Darío Cienfuegos, Carmina Badillo, etc.) a menos que ${userName} te pregunte explícitamente por ellos o pida un resumen de su agenda completa.
    - Cada cliente es totalmente independiente: no mezcles sus historiales, tareas ni agendas.
    - Si ${userName} te cuestiona por qué mencionaste a otro cliente o qué pasó, NO des discursos de IA sobre errores de asociación. Responde con sobriedad y en una sola frase breve: "Disculpa la confusión, ${userName}. Enfocándonos 100% en [Nombre del cliente]:" y entrega inmediatamente la información exacta de ese cliente y el copy propuesto.

12. LÓGICA TEMPORAL EXACTA Y CERO CONTRADICCIONES HORARIAS:
    - HORA EXACTA ACTUAL EN PERÚ: ${currentTimeStr} (${todayDateStr}).
    - Cualquier hora menor a las ${currentTimeStr} de hoy (ejemplo: 12:00 o 16:00 cuando son las 17:36) YA OCURRIÓ Y PERTENECE AL PASADO.
    - PROHIBICIÓN TERMINANTE DE LLAMAR "FUTURAS" A HORAS QUE YA PASARON: NUNCA digas que las tareas de hoy con hora anterior a las ${currentTimeStr} son "futuras", que "aún no llegan" o que "están a tiempo sin retraso". Decir eso es una falsedad matemática inadmisible.
    - Si la hora de una tarea ya pasó hoy y no se ha marcado como realizada o reprogramada, ESTÁ RETRASADA / VENCIDA HOY.
    - Reporta con total exactitud y transparencia qué tareas de hoy ya pasaron su hora y cuáles son para más tarde.

RESPONDE SIEMPRE EN FORMATO JSON ESTRICTO con esta estructura:
{
  "intent": "update_lead" | "create_lead" | "general_chat",
  "target_lead_id": "id del lead si se identificó, o null",
  "target_lead_name": "nombre del lead si aplica",
  "note_text": "texto de la nota para la bitácora si aplica",
  "next_action_text": "texto de la próxima acción si aplica",
  "next_action_date": "YYYY-MM-DDTHH:mm si aplica",
  "new_status": "prospecto | llamado | cita_agendada | presentacion_realizada | cerrado_ganado | cerrado_perdido si aplica",
  "new_plan": "plan_30 | plan_80 | plan_200 | plan_500 | plan_1200 si aplica",
  "new_value": null,
  "new_lead_data": { "business_name": "", "contact_name": "", "phone": "", "target_plan": "plan_30", "estimated_value": 400 },
  "reply_message": "Tu respuesta detallada, estructurada, empática y estratégica para ${userName}. Si incluye mensaje de WhatsApp, ponlo claramente entre comillas o en bloque para facilitar su lectura."
}`;

    // Format conversation history ensuring roles are 'user' or 'assistant'
    const formattedHistory = (conversationHistory || [])
      .slice(-12)
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || m.text || ''
      }))
      .filter(m => m.content && m.content.trim().length > 0);

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userMessage }
    ];

    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: aiMessages,
        temperature: 0.3
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('DashScope API returned error:', errText);
      return res.status(500).json({ error: `DashScope API error: ${errText}` });
    }

    const responsePayload = await aiRes.json();
    const rawContent = responsePayload.choices?.[0]?.message?.content || '{}';
    const parsedAiData = robustParseAIResponse(rawContent);
    if (parsedAiData.reply_message) {
      parsedAiData.reply_message = sanitizeReplyText(parsedAiData.reply_message);
    }
    return res.status(200).json(parsedAiData);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

function sanitizeReplyText(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/\(?\bids?\s*:\s*["']?[0-9a-fA-F-]{36}["']?\)?/gi, '')
    .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/  +/g, ' ');
}

function robustParseAIResponse(raw) {
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
