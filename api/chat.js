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

    const DEFAULT_KEY = 'sk-ws-H.DMLLELE.Ns7U.MEQCIEQeFcXistPzyFJ3JaFIfIwVAvEaxrfhN9E8et6HLLadAiAOEVqQ8dMN1M0bBuZEUdsC-hotw6l_Fm5LUUJ8gR9FOw';
    const DEFAULT_URL = 'https://ws-4obirdagiy942cl5.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions';
    const DEFAULT_MODEL = 'qwen-plus';

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

    const myHoyTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'HOY' && l.is_my_lead);
    const otherHoyTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'HOY' && !l.is_my_lead);
    const myMananaTasks = (leadsSummary || []).filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && l.is_my_lead);
    const otherMananaTasks = (leadsSummary || []).filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd) && !l.is_my_lead);
    const myVencidas = (leadsSummary || []).filter(l => l.categoria_agenda === 'VENCIDA' && l.is_my_lead);
    const otherVencidas = (leadsSummary || []).filter(l => l.categoria_agenda === 'VENCIDA' && !l.is_my_lead);

    const agendaPrecalculada = `CALENDARIO Y MAPA DE TIEMPO EXACTO (VERDAD ABSOLUTA PARA INTERPRETAR FECHAS):
${timeRef.join('\n')}

AGENDA OFICIAL PRECALCULADA POR EL SISTEMA:
- TAREAS PERSONALES DE ${userName.toUpperCase()} PARA HOY (${todayDateStr}):
${myHoyTasks.length > 0 ? myHoyTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para hoy)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA HOY:
${otherHoyTasks.length > 0 ? otherHoyTasks.map(t => `  • [Asesor asignado: ${t.advisor_name || 'Otro asesor'}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (Ningún otro asesor tiene tareas para hoy)'}

- TAREAS PERSONALES DE ${userName.toUpperCase()} PARA MAÑANA (${tomorrowDateStr}):
${myMananaTasks.length > 0 ? myMananaTasks.map(t => `  • [TU LEAD] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No tienes tareas personales agendadas para mañana)'}

- TAREAS DEL EQUIPO / OTROS ASESORES PARA MAÑANA:
${otherMananaTasks.length > 0 ? otherMananaTasks.map(t => `  • [Asesor asignado: ${t.advisor_name || 'Otro asesor'}] ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas del equipo para mañana)'}

- TAREAS PERSONALES PENDIENTES CON FECHA ANTERIOR (VENCIDAS):
${myVencidas.slice(0, 6).map(t => `  • [TU LEAD] ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}`;

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

INSTRUCCIONES CLAVE DE INTELIGENCIA, IDENTIDAD Y MEMORIA:
1. IDENTIDAD DEL USUARIO Y PROPIEDAD DE PROSPECTOS (REGLA FUNDAMENTAL):
   - Estás hablando DIRECTAMENTE con ${userName} (${userContext.userEmail || ''}).
   - Cada prospecto en la base de datos tiene "advisor_name" y "is_my_lead".
   - Cuando ${userName} pregunte en primera persona por "mis tareas", "mis llamadas", "qué tengo hoy", "a quién llamo hoy", "mis clientes", o pregunte en general "¿qué tareas hay hoy?", responde PRIORITARIAMENTE Y ENFOCÁNDOTE EN SUS PROPIOS PROSPECTOS (donde is_my_lead: true).
   - NUNCA le atribuyas como suyas las tareas de otros asesores (como Luis Hakim o Darío Cienfuegos).
   - Si ${userName} NO tiene tareas personales para hoy (es decir, la lista de tareas personales de hoy está vacía):
     * Indícalo con total transparencia: "${userName}, en tu cartera personal no tienes tareas agendadas para hoy ${todayDateStr.split(',')[0]}."
     * Puedes mencionar brevemente las tareas de sus compañeros de equipo solo a modo informativo: "Como referencia de tu equipo: Luis Hakim tiene a... y Darío Cienfuegos tiene a..."
     * Y de inmediato preséntale sus próximas llamadas que arrancan mañana: "Tus llamadas personales empiezan mañana ${tomorrowDateStr.split(',')[0]}: ..."
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

7. Si el usuario te pide registrar una nota, llamada o acordar una cita/tarea:
   - Identifica al prospecto (por nombre o aproximación).
   - Extrae la nota para la bitácora y la próxima acción calculando fecha/hora YYYY-MM-DDTHH:mm.
   - Establece "intent": "update_lead".

8. Si el usuario pide crear un nuevo lead:
   - Extrae nombre, teléfono, plan, valor estimado.
   - Establece "intent": "create_lead".

9. FORMATO VISUAL LIMPIO:
   - No satures el texto con asteriscos (**). Úsalos solo con moderación para títulos clave.
   - Los mensajes propuestos para WhatsApp colócalos entre comillas en su propio bloque o párrafo para que resalten.

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
    return res.status(200).json(parsedAiData);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
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
