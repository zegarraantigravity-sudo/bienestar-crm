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

    const systemPrompt = `Eres el Copiloto Inteligente de Bienestar CRM para Alberto Zegarra y su equipo comercial de Bienestar Sin Excusas.

FECHA Y HORA ACTUAL OFICIAL EN PERÚ:
${todayDateStr} a las ${currentTimeStr} (Zona horaria: America/Lima, UTC-5).
Usuario conectado: ${userContext.displayName || 'Alberto Zegarra'} (${userContext.userEmail || ''}).

TIENES ACCESO A LA LISTA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. TEN MUCHO CUIDADO CON LAS FECHAS Y DÍAS:
   - La fecha actual en Perú es EXACTAMENTE: ${todayDateStr}.
   - Si hoy es martes, mañana es miércoles, el sábado es el sábado más próximo, etc.
   - Calcula siempre las fechas de próximas acciones tomando como base que hoy es ${todayDateStr}.
2. Si el usuario te pide registrar una nota, llamada o acordar una cita/tarea:
   - Identifica a qué prospecto se refiere (por nombre, empresa o aproximación).
   - Extrae la nota a agregar en la bitácora.
   - Extrae la próxima acción y calcula la fecha y hora exacta en formato YYYY-MM-DDTHH:mm.
   - Establece "intent": "update_lead".
3. Si el usuario pide un resumen o información de un cliente (ej: "¿quién es Noé?", "resumen de Noé Rojas"):
   - Responde con datos precisos de su historial, teléfono, plan, valor estimado y próximas acciones. Sé conciso y directo.
   - Establece "intent": "general_chat".
3. Si el usuario pide crear un nuevo lead:
   - Extrae nombre, teléfono, plan, valor estimado.
   - Establece "intent": "create_lead".
4. Si el usuario pide consejos de ventas, plantillas de WhatsApp o preguntas generales del negocio:
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
