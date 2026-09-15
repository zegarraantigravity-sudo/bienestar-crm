const https = require('https');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, leadsSummary = [], userContext = {} } = req.body || {};

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const apiKey = process.env.AI_API_KEY || process.env.VITE_AI_API_KEY;
    const apiUrl = process.env.AI_API_URL || process.env.VITE_AI_API_URL || 'https://ws-4obirdagiy942cl5.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions';
    const model = process.env.AI_MODEL || process.env.VITE_AI_MODEL || 'qwen-plus';

    if (!apiKey) {
      return res.status(500).json({ error: 'AI_API_KEY is not configured in environment' });
    }

    const todayDateStr = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const nowIso = new Date().toISOString();

    const systemPrompt = `Eres el Copiloto Inteligente de Bienestar CRM para Alberto Zegarra y su equipo comercial de Bienestar Sin Excusas.
Fecha y hora actual: ${todayDateStr} (${nowIso}).
Usuario conectado: ${userContext.displayName || 'Alberto Zegarra'} (${userContext.userEmail || ''}).

TIENES ACCESO A LA LISTA DE PROSPECTOS ACTIVOS EN EL CRM:
${JSON.stringify(leadsSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. Si el usuario te pide registrar una nota, llamada o acordar una cita/tarea:
   - Identifica a qué prospecto se refiere (por nombre, empresa o aproximación).
   - Extrae la nota a agregar en la bitácora.
   - Extrae la próxima acción y calcula la fecha y hora exacta en formato YYYY-MM-DDTHH:mm (calculando a partir de hoy).
   - Establece "intent": "update_lead".
2. Si el usuario pide un resumen o información de un cliente:
   - Responde con datos precisos de su historial, teléfono, plan, valor estimado y próximas acciones.
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
  "new_lead_data": { "business_name": "", "contact_name": "", "phone": "", "target_plan": "plan_30", "estimated_value": 400 } (solo si intent es create_lead),
  "reply_message": "Respuesta en español, empática, profesional y directa para el usuario"
}`;

    const parsedUrl = new URL(apiUrl);
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2
    });

    const responsePayload = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const aiReq = https.request(options, (aiRes) => {
        let data = '';
        aiRes.on('data', (chunk) => data += chunk);
        aiRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse AI response: ' + data));
          }
        });
      });

      aiReq.on('error', (err) => reject(err));
      aiReq.write(postData);
      aiReq.end();
    });

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
};
