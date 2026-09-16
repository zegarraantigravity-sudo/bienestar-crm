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

    const hoyTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'HOY');
    const mananaTasks = (leadsSummary || []).filter(l => l.next_action_date && l.next_action_date.startsWith(tomorrowPeruYmd));
    const vencidasTasks = (leadsSummary || []).filter(l => l.categoria_agenda === 'VENCIDA');

    const agendaPrecalculada = `CALENDARIO Y AGENDA OFICIAL PRECALCULADA POR EL SISTEMA (VERDAD ABSOLUTA):
- Tareas programadas estrictamente para HOY (${todayDateStr}):
${hoyTasks.length > 0 ? hoyTasks.map(t => `  • ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas programadas para hoy)'}

- Tareas programadas para MAÑANA (${tomorrowDateStr}):
${mananaTasks.length > 0 ? mananaTasks.map(t => `  • ${t.name} a las ${t.next_action_date.split('T')[1] || 'hora no especificada'}: "${t.next_action}"`).join('\n') : '  (No hay tareas programadas para mañana)'}

- Tareas pendientes con fecha anterior (VENCIDAS):
${vencidasTasks.slice(0, 6).map(t => `  • ${t.name} (${t.next_action_date}): "${t.next_action}"`).join('\n')}`;

    const systemPrompt = `Eres el Copiloto Inteligente y Estratega Comercial de Bienestar CRM para Alberto Zegarra y su equipo de ventas de Bienestar Sin Excusas.

FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${todayDateStr} a las ${currentTimeStr} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userContext.displayName || 'Alberto Zegarra'} (${userContext.userEmail || ''}).

${agendaPrecalculada}

BASE DE DATOS COMPLETA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

METAS Y OBJETIVOS COMERCIALES POR ETAPA DEL EMBUDO:
- prospecto: Romper el hielo, descubrir su modelo (gimnasio, entrenador, nutricionista, coach) y agendar demo corta de 15 min en Zoom.
- llamado / cita_agendada: Realizar la demo de la app mostrando rutinas, dietas y automatización de clientes.
- presentacion_realizada: Cerrar venta de Plan 30 (S/. 400) o Plan 80 (S/. 700), resolver objeciones (tiempo, dinero, tecnología) o activar prueba de 3 días.
- cerrado_ganado: Asegurar satisfacción, solicitar testimonios y pedir referidos.
- cerrado_perdido: Seguimiento empático sin presión para reactivar en el momento oportuno.

INSTRUCCIONES CLAVE DE INTELIGENCIA Y MEMORIA:
1. MEMORIA CONTINUA DE CONVERSACIÓN (NO OLVIDAR NADA):
   - Tienes acceso al historial reciente de mensajes de esta sesión de chat.
   - Si Alberto hace preguntas de seguimiento ("¿y qué le digo a él?", "¿a qué hora?", "¿y de quién me hablabas?"), MANTÉN el hilo de la conversación y el cliente del que venían hablando. NUNCA le pidas a Alberto que te repita o vuelva a explicar de quién habla si ya fue mencionado en los mensajes anteriores.
2. ASESORÍA ESTRATÉGICA Y REDACCIÓN DE MENSAJES (COPYWRITING PARA WHATSAPP):
   - Cuando Alberto pregunte qué escribirle a un cliente, cómo responderle, cuándo escribirle o pida un consejo considerando lo que se ha conversado:
     a) Revisa TODA la bitácora/timeline del cliente: qué le dijo a Alberto, qué dudas u objeciones puso, qué acuerdos hicieron y qué se busca lograr con él.
     b) Redacta el MENSAJE EXACTO listo para copiar y pegar en WhatsApp:
        * Tono cálido, natural, empático y comercial al estilo peruano/latino de Alberto Zegarra.
        * CERO lenguaje robótico o corporativo acartonado.
        * Saludo cordial con su nombre, referencia sutil a lo que hablaron y una pregunta o llamado a la acción (CTA) claro y sin fricción.
     c) RECOMIENDA EL DÍA Y HORA EXACTA PARA ENVIARLO y explica brevemente por qué es el momento más estratégico.
     d) Explica en 1 o 2 líneas el porqué psicológico/comercial de la estrategia elegida.
3. REGLA ESTRICTA PARA TAREAS DE HOY:
   - Para las tareas de HOY: menciona ÚNICA Y EXCLUSIVAMENTE los prospectos con categoria_agenda: "HOY".
   - NUNCA incluyas a prospectos de mañana en las tareas de hoy. Si deseas mencionar tareas futuras, hazlo en una sección separada abajo: "📅 Para mañana (${tomorrowDateStr.split(',')[0]}):".
4. Si el usuario te pide registrar una nota, llamada o acordar una cita/tarea:
   - Identifica al prospecto (por nombre o aproximación).
   - Extrae la nota para la bitácora y la próxima acción calculando fecha/hora YYYY-MM-DDTHH:mm.
   - Establece "intent": "update_lead".
5. Si el usuario pide crear un nuevo lead:
   - Extrae nombre, teléfono, plan, valor estimado.
   - Establece "intent": "create_lead".

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
  "reply_message": "Tu respuesta detallada, estructurada, empática y estratégica para Alberto. Si incluye mensaje de WhatsApp, ponlo claramente entre comillas o en bloque para facilitar su lectura."
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
    
    // Clean markdown code blocks if present
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsedAiData = JSON.parse(jsonStr);
      return res.status(200).json(parsedAiData);
    } catch (parseError) {
      return res.status(200).json({
        intent: 'general_chat',
        reply_message: rawContent
      });
    }

  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
