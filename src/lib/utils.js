export const getWhatsAppUrl = (phone, customText = '') => {
  if (!phone) return null;
  let digits = phone.toString().replace(/\D/g, '');
  if (!digits) return null;
  
  // Auto prepend 51 (Peru country code) if it's a 9-digit Peruvian number starting with 9
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = '51' + digits;
  }

  const textParam = customText ? `?text=${encodeURIComponent(customText)}` : '';
  return `https://wa.me/${digits}${textParam}`;
};

export const defaultWhatsAppTemplates = [
  {
    id: 'primer_contacto',
    title: '📩 Primer Contacto / Saludo',
    getText: (lead) => `Hola ${lead.contact_name || lead.business_name}, te saludo de Bienestar Sin Excusas. Vi tu interés en potenciar tu negocio con nuestra plataforma. ¿Tendrás unos minutos para conversar?`
  },
  {
    id: 'recordatorio_demo',
    title: '📅 Recordatorio de Cita / Demo',
    getText: (lead) => `Hola ${lead.contact_name || lead.business_name}, ¿cómo estás? Te escribo para recordar nuestra demostración agendada sobre Bienestar Sin Excusas. ¡Quedo atento!`
  },
  {
    id: 'propuesta_plan',
    title: '📋 Presentación de Plan Objetivo',
    getText: (lead) => `Hola ${lead.contact_name || lead.business_name}, te comparto los detalles del ${getPlanLabel(lead.target_plan)} por S/. ${lead.estimated_value || 0}. Con este plan tendrás acceso a todas nuestras herramientas comerciales.`
  },
  {
    id: 'seguimiento_general',
    title: '🔄 Seguimiento Post-Demo',
    getText: (lead) => `Hola ${lead.contact_name || lead.business_name}, ¿qué tal? Te escribo para saber si tuviste oportunidad de revisar lo que conversamos sobre Bienestar Sin Excusas. ¿Tienes alguna consulta?`
  },
  {
    id: 'cierre_sin_respuesta',
    title: '🤝 Cierre por Sin Respuesta / Despedida',
    getText: (lead) => `Hola ${lead.contact_name ? lead.contact_name.split(' ')[0] : 'colega'}, ¿cómo estás?

Como no tuve respuesta a mi mensaje anterior, imagino que andas a tope con tus consultas o que ahora mismo no es tu prioridad automatizar dietas ni tener una App propia con tu marca.

Totalmente entendible. Para no insistirte ni saturar tu WhatsApp, cierro tu seguimiento por aquí.

Si en algún momento más adelante te hace sentido atender a más de 100 pacientes sin pasar horas armando planes en Excel, me escribes y lo retomamos con gusto.

¡Muchos éxitos con tus pacientes! 🤝`
  }
];

export const getPlanLabel = (planKey) => {
  const planLabels = {
    plan_30: 'Plan 30',
    plan_80: 'Plan 80',
    plan_200: 'Plan 200',
    plan_500: 'Plan 500',
    plan_1200: 'Plan 1200',
    prueba_30_creditos: 'Plan 30',
    estandar: 'Plan Estándar',
    premium: 'Plan Premium'
  };
  return planLabels[planKey] || planKey || 'Plan';
};

export const getDaysInactive = (lastInteractionIso) => {
  if (!lastInteractionIso) return 0;
  const lastDate = new Date(lastInteractionIso);
  const now = new Date();
  const diffTime = Math.abs(now - lastDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const isDateToday = (dateIsoStr) => {
  if (!dateIsoStr) return false;
  const date = new Date(dateIsoStr);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isDateOverdue = (dateIsoStr) => {
  if (!dateIsoStr) return false;
  const date = new Date(dateIsoStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const formatDateTimeDisplay = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const dateStr = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    const timeStr = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  } catch (e) {
    return isoStr;
  }
};

// Roles, Permissions & Sales Representatives
export const SUPER_ADMIN_EMAILS = [
  'albertozbcoach@gmail.com',
  'zegarraantigravity@gmail.com'
];

export const SALES_REPRESENTATIVES = [
  { id: 'alberto', name: 'Alberto Zegarra', email: 'albertozbcoach@gmail.com' },
  { id: 'luis', name: 'Luis Hakim', email: 'torohakim@gmail.com' },
  { id: 'dario', name: 'Dario Cienfuegos', email: 'dariospaarnold@gmail.com' }
];

export const isSuperAdmin = (email) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export const getUserDisplayName = (email) => {
  if (!email) return 'Usuario';
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'albertozbcoach@gmail.com' || cleanEmail === 'zegarraantigravity@gmail.com') {
    return 'Alberto Zegarra';
  }
  if (cleanEmail === 'torohakim@gmail.com') {
    return 'Luis Hakim';
  }
  if (cleanEmail === 'dariospaarnold@gmail.com') {
    return 'Dario Cienfuegos';
  }
  return email.split('@')[0];
};

export const getUserRoleLabel = (email) => {
  if (isSuperAdmin(email)) return 'Super Administrador (Dueño)';
  return 'Socio Comercial (Vendedor)';
};

export const canUserViewLead = (lead, userEmail) => {
  if (!userEmail) return false;
  if (isSuperAdmin(userEmail)) return true; // Alberto (Super Admin) sees all leads

  const assigned = (lead.assigned_to || '').toLowerCase().trim();
  const user = userEmail.toLowerCase().trim();

  // If Dario Cienfuegos logs in:
  if (user === 'dariospaarnold@gmail.com') {
    return assigned.includes('dario') || assigned.includes('cienfuegos') || assigned.includes('dariospaarnold');
  }

  // If Luis Hakim logs in:
  if (user === 'torohakim@gmail.com') {
    const isAlbertoLead = assigned.includes('alberto') || assigned.includes('zegarra');
    const isDarioLead = assigned.includes('dario') || assigned.includes('cienfuegos');
    return !isAlbertoLead && !isDarioLead;
  }

  // Any other seller only sees their assigned leads
  return assigned.includes(user);
};
