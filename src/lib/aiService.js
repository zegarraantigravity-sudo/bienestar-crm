/**
 * aiService.js
 * Client service to communicate with the CRM AI Copilot
 */

const DEFAULT_KEY = 'sk-ws-H.DMLLELE.Ns7U.MEQCIEQeFcXistPzyFJ3JaFIfIwVAvEaxrfhN9E8et6HLLadAiAOEVqQ8dMN1M0bBuZEUdsC-hotw6l_Fm5LUUJ8gR9FOw';
const DEFAULT_URL = 'https://ws-4obirdagiy942cl5.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus';

export async function askAICopilot({ userMessage, leads, userEmail, userDisplayName }) {
  // Extract a lightweight, essential summary of leads to send to the AI
  const leadsSummary = (leads || []).slice(0, 40).map(l => {
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
      recent_notes: lastNotes
    };
  });

  const payload = {
    userMessage,
    leadsSummary,
    userContext: {
      userEmail,
      displayName: userDisplayName
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

  const todayDateStr = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const systemPrompt = `Eres el Copiloto Inteligente de Bienestar CRM.
Fecha y hora actual: ${todayDateStr} (${new Date().toISOString()}).
Usuario conectado: ${userDisplayName} (${userEmail}).

PROSPECTOS ACTIVOS EN CRM:
${JSON.stringify(leadsSummary, null, 2)}

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
