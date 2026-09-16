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

    const { userMessage, leadsSummary = [], userContext = {} } = body || {};

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

    const systemPrompt = `Eres el Copiloto Inteligente de Bienestar CRM para Alberto Zegarra y su equipo comercial de Bienestar Sin Excusas.

FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${todayDateStr} a las ${currentTimeStr} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userContext.displayName || 'Alberto Zegarra'} (${userContext.userEmail || ''}).

${agendaPrecalculada}

TIENES ACCESO A LA LISTA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. TEN MUCHO CUIDADO CON LAS FECHAS Y DÍAS:
   - La fecha actual en Perú es EXACTAMENTE: ${todayDateStr}.
   - Si hoy es ${todayDateStr.split(',')[0]}, mañana es ${tomorrowDateStr.split(',')[0]}.
   - Calcula siempre las fechas de próximas acciones tomando como base que hoy es ${todayDateStr}.
2. REGLA ESTRICTA PARA PREGUNTAS DE TAREAS ("¿Qué tareas o llamadas tengo para hoy?"):
   - Guíate DIRECTAMENTE por la sección "Tareas programadas estrictamente para HOY" del bloque precalculado.
   - Para las tareas de HOY: menciona ÚNICA Y EXCLUSIVAMENTE los prospectos programados para HOY.
   - NUNCA incluyas a un prospecto con fecha futura/mañana (como Claudia Advincula u Oscar Fara) dentro de las tareas de hoy.
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
5. Si el usuario pide crear un nuevo lead:
   - Extrae nombre, teléfono, plan, valor estimado.
   - Establece "intent": "create_lead".
6. Si el usuario pide consejos de ventas, plantillas de WhatsApp o preguntas generales del negocio:
   - Responde amablemente con consejos comerciales orientados al rubro fitness / salud / coaches.
   - Establece "intent": "general_chat".

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
  "reply_message": "Respuesta en español, empática, profesional y directa para el usuario"
}`;

    const aiRes = await fetch(apiUrl, {
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
