import React from 'react';
import { ChevronLeft, ChevronRight, Phone, Calendar, Target, MessageCircle, AlertCircle, Snowflake } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getWhatsAppUrl, getDaysInactive, isDateToday, isDateOverdue, formatDateTimeDisplay } from '../lib/utils';

const columns = [
  { id: 'prospecto', title: 'Prospectos', color: 'hsl(var(--color-prospecto))' },
  { id: 'llamado', title: 'Contactados', color: 'hsl(var(--color-llamado))' },
  { id: 'cita_agendada', title: 'Citas', color: 'hsl(var(--color-cita))' },
  { id: 'presentacion_realizada', title: 'Demos', color: 'hsl(var(--color-presentacion))' },
  { id: 'cerrado_ganado', title: 'Ganados', color: 'hsl(var(--color-ganado))' },
  { id: 'cerrado_perdido', title: 'Perdidos', color: 'hsl(var(--color-perdido))' }
];

const clientTypeMapping = {
  coach: { label: 'Coach', cssClass: 'badge-coach' },
  nutricionista: { label: 'Nutri', cssClass: 'badge-nutri' },
  gimnasio: { label: 'Gimnasio', cssClass: 'badge-gimnasio' },
  tienda_suplementos: { label: 'Tienda', cssClass: 'badge-tienda' },
  herbalife_distribuidor: { label: 'Herbalife', cssClass: 'badge-herbalife' },
  otro: { label: 'Otro', cssClass: 'badge-otro' }
};

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

export default function KanbanView({ leads, onUpdateLead, onSelectLead, onOpenWhatsApp, onRequestLostReason }) {
  
  const getNextStatus = (currentStatus) => {
    const idx = columns.findIndex(col => col.id === currentStatus);
    if (idx < columns.length - 1) return columns[idx + 1].id;
    return null;
  };

  const getPrevStatus = (currentStatus) => {
    const idx = columns.findIndex(col => col.id === currentStatus);
    if (idx > 0) return columns[idx - 1].id;
    return null;
  };

  const handleMove = async (lead, newStatus, e) => {
    e.stopPropagation(); // Prevent opening the detail modal
    if (!newStatus) return;

    if (newStatus === 'cerrado_perdido' && onRequestLostReason) {
      onRequestLostReason(lead, newStatus);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: newStatus, last_interaction: new Date().toISOString() })
        .eq('id', lead.id)
        .select();

      if (error) throw error;
      onUpdateLead(data[0]);
    } catch (e) {
      console.error('Error shifting lead status:', e);
      alert('Error al mover el lead: ' + e.message);
    }
  };

  const handleLogCall = async (lead, e) => {
    e.stopPropagation(); // Prevent modal trigger
    
    // Parse notes payload
    let notesList = [];
    let nextActionText = '';
    let nextActionDate = '';
    try {
      const parsed = JSON.parse(lead.notes || '[]');
      if (Array.isArray(parsed)) {
        notesList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        notesList = parsed.timeline || [];
        nextActionText = parsed.next_action || '';
        nextActionDate = parsed.next_action_date || '';
      } else {
        notesList = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
      }
    } catch (err) {
      notesList = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
    }

    // Append standard call note
    const newNote = {
      date: new Date().toISOString(),
      text: "📞 Llamada comercial realizada desde el Tablero Kanban."
    };
    const updatedNotesList = [newNote, ...notesList];

    try {
      const notesPayload = JSON.stringify({
        timeline: updatedNotesList,
        next_action: nextActionText,
        next_action_date: nextActionDate
      });

      const { data, error } = await supabase
        .from('leads')
        .update({
          status: 'llamado',
          notes: notesPayload,
          last_interaction: new Date().toISOString()
        })
        .eq('id', lead.id)
        .select();

      if (error) throw error;
      onUpdateLead(data[0]);
    } catch (err) {
      console.error('Error logging call on lead:', err);
      alert('Error al registrar llamada: ' + err.message);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(val);
  };

  const parseLeadNotes = (notesString) => {
    try {
      const obj = JSON.parse(notesString);
      if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        return {
          action: obj.next_action || '',
          actionDate: obj.next_action_date || '',
          lostReasonLabel: obj.lost_reason_label || ''
        };
      }
    } catch (e) {}
    return { action: '', actionDate: '', lostReasonLabel: '' };
  };

  return (
    <div className="kanban-board">
      {columns.map(col => {
        const colLeads = leads.filter(l => l.status === col.id);
        const colTotalValue = colLeads.reduce((sum, l) => sum + (parseFloat(l.estimated_value) || 0), 0);

        return (
          <div className="kanban-column" key={col.id}>
            <div className="column-header">
              <div className="column-title">
                <div className={`column-indicator indicator-${col.id}`}></div>
                <span>{col.title}</span>
              </div>
              <div className="column-count">
                {colLeads.length}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', padding: '0 6px', fontWeight: 600 }}>
              Valor: {formatCurrency(colTotalValue)}
            </div>

            <div className="cards-container">
              {colLeads.map(lead => {
                const clientType = clientTypeMapping[lead.client_type] || clientTypeMapping.otro;
                const nextStatus = getNextStatus(lead.status);
                const prevStatus = getPrevStatus(lead.status);
                const { action, actionDate, lostReasonLabel } = parseLeadNotes(lead.notes);
                const waUrl = getWhatsAppUrl(lead.phone, lead.contact_name || lead.business_name);
                
                const daysInactive = getDaysInactive(lead.last_interaction);
                const isStale = daysInactive >= 5 && !['cerrado_ganado', 'cerrado_perdido'].includes(lead.status);
                const isOverdue = isDateOverdue(actionDate);
                const isToday = isDateToday(actionDate);

                return (
                  <div 
                    className="kanban-card" 
                    key={lead.id} 
                    onClick={() => onSelectLead(lead)}
                    style={{
                      borderLeft: isStale ? '3px solid #38bdf8' : isOverdue ? '3px solid #ef4444' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="card-business-name">{lead.business_name}</div>
                      {isStale && (
                        <span 
                          style={{
                            fontSize: '0.65rem',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={`Sin interacción en los últimos ${daysInactive} días`}
                        >
                          <Snowflake size={10} /> +{daysInactive}d sin contacto
                        </span>
                      )}
                    </div>
                    <div className="card-contact-name">{lead.contact_name}</div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`badge badge-client ${clientType.cssClass}`}>
                        {clientType.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        {planLabels[lead.target_plan] || lead.target_plan}
                      </span>
                    </div>

                    {/* Display Next Action if defined */}
                    {action && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: isOverdue ? '#ef4444' : isToday ? '#f97316' : 'hsl(var(--color-presentacion))', 
                        marginTop: '8px', 
                        padding: '6px 8px', 
                        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.08)' : isToday ? 'rgba(249, 115, 22, 0.08)' : 'hsla(35, 100%, 55%, 0.08)', 
                        borderRadius: '6px',
                        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.2)' : isToday ? '1px solid rgba(249, 115, 22, 0.2)' : '1px solid hsla(35, 100%, 55%, 0.15)',
                        fontWeight: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Target size={12} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {action}
                          </span>
                        </div>
                        {actionDate && (
                          <div style={{ fontSize: '0.7rem', opacity: 0.85, paddingLeft: '18px', fontWeight: 600 }}>
                            {isOverdue ? '⚠️ Vencido: ' : isToday ? '⏰ HOY: ' : '📅 '}
                            {formatDateTimeDisplay(actionDate)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display lost reason if in cerrado_perdido */}
                    {lead.status === 'cerrado_perdido' && lostReasonLabel && (
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'hsl(var(--color-perdido))',
                        marginTop: '6px',
                        fontStyle: 'italic'
                      }}>
                        Motivo: {lostReasonLabel}
                      </div>
                    )}

                    <div className="card-footer">
                      <span className="card-value">{formatCurrency(lead.estimated_value)}</span>
                      
                      <div className="card-actions">
                        {lead.phone && (
                          <button 
                            type="button"
                            className="btn-icon-only btn-whatsapp-icon"
                            title="Opciones de WhatsApp"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenWhatsApp) onOpenWhatsApp(lead);
                              else if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
                            }}
                            style={{ padding: '4px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <MessageCircle size={12} />
                          </button>
                        )}

                        {/* Quick log call button if in 'prospecto' status */}
                        {lead.status === 'prospecto' && (
                          <button 
                            className="btn-icon-only" 
                            title="Registrar llamada y mover"
                            onClick={(e) => handleLogCall(lead, e)}
                            style={{ padding: '4px', borderRadius: '6px' }}
                          >
                            <Phone size={12} />
                          </button>
                        )}

                        {prevStatus && (
                          <button 
                            className="btn-icon-only" 
                            title="Mover atrás"
                            onClick={(e) => handleMove(lead, prevStatus, e)}
                            style={{ padding: '4px', borderRadius: '6px' }}
                          >
                            <ChevronLeft size={12} />
                          </button>
                        )}

                        {nextStatus && (
                          <button 
                            className="btn-icon-only" 
                            title="Mover adelante"
                            onClick={(e) => handleMove(lead, nextStatus, e)}
                            style={{ padding: '4px', borderRadius: '6px' }}
                          >
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {colLeads.length === 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '24px 0', 
                  border: '1px dashed hsl(var(--border-color))',
                  borderRadius: '10px',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '0.75rem'
                }}>
                  Sin prospectos
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
