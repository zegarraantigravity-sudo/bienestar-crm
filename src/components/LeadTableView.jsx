import React, { useState } from 'react';
import { Search, Phone, Mail, Plus, Target, MessageCircle, Calendar, Snowflake, Clock, AlertCircle } from 'lucide-react';
import { getWhatsAppUrl, getDaysInactive, isDateToday, isDateOverdue, formatDateTimeDisplay } from '../lib/utils';

const clientTypeLabels = {
  coach: 'Entrenador (Coach)',
  nutricionista: 'Nutricionista',
  gimnasio: 'Gimnasio',
  tienda_suplementos: 'Tienda Suplementos',
  herbalife_distribuidor: 'Herbalife',
  otro: 'Otro'
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

const statusLabels = {
  prospecto: '1. Prospecto',
  llamado: '2. Contactado',
  cita_agendada: '3. Cita Agendada',
  presentacion_realizada: '4. Demo Realizada',
  cerrado_ganado: '5. Cerrado Ganado',
  cerrado_perdido: '6. Cerrado Perdido'
};

const clientTypeBadgeClasses = {
  coach: 'badge-coach',
  nutricionista: 'badge-nutri',
  gimnasio: 'badge-gimnasio',
  tienda_suplementos: 'badge-tienda',
  herbalife_distribuidor: 'badge-herbalife',
  otro: 'badge-otro'
};

export default function LeadTableView({ leads, onSelectLead, onAddNewLead, onOpenWhatsApp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [planFilter, setPlanFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [smartTab, setSmartTab] = useState('todos'); // 'todos' | 'hoy_vencidos' | 'estancados'

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

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const { action, actionDate } = parseLeadNotes(lead.notes);

    const searchString = `${lead.business_name} ${lead.contact_name} ${lead.phone || ''} ${lead.email || ''} ${action}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
    const matchesPlan = planFilter === 'todos' || lead.target_plan === planFilter;
    const matchesType = typeFilter === 'todos' || lead.client_type === typeFilter;

    // Smart tab filtering
    let matchesSmart = true;
    if (smartTab === 'hoy_vencidos') {
      matchesSmart = actionDate && (isDateToday(actionDate) || isDateOverdue(actionDate));
    } else if (smartTab === 'estancados') {
      const daysInactive = getDaysInactive(lead.last_interaction);
      matchesSmart = daysInactive >= 5 && !['cerrado_ganado', 'cerrado_perdido'].includes(lead.status);
    }

    return matchesSearch && matchesStatus && matchesPlan && matchesType && matchesSmart;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  // Calculate smart counters
  const countHoyVencidos = leads.filter(l => {
    const { actionDate } = parseLeadNotes(l.notes);
    return actionDate && (isDateToday(actionDate) || isDateOverdue(actionDate));
  }).length;

  const countEstancados = leads.filter(l => {
    const daysInactive = getDaysInactive(l.last_interaction);
    return daysInactive >= 5 && !['cerrado_ganado', 'cerrado_perdido'].includes(l.status);
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Smart Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setSmartTab('todos')}
          className={`btn ${smartTab === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '8px 14px' }}
        >
          Todos los Leads ({leads.length})
        </button>
        <button
          type="button"
          onClick={() => setSmartTab('hoy_vencidos')}
          className={`btn ${smartTab === 'hoy_vencidos' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            fontSize: '0.85rem',
            padding: '8px 14px',
            borderColor: countHoyVencidos > 0 ? 'rgba(249, 115, 22, 0.4)' : undefined,
            color: smartTab !== 'hoy_vencidos' && countHoyVencidos > 0 ? '#f97316' : undefined
          }}
        >
          ⏰ Tareas de Hoy / Vencidas ({countHoyVencidos})
        </button>
        <button
          type="button"
          onClick={() => setSmartTab('estancados')}
          className={`btn ${smartTab === 'estancados' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            fontSize: '0.85rem',
            padding: '8px 14px',
            borderColor: countEstancados > 0 ? 'rgba(56, 189, 248, 0.4)' : undefined,
            color: smartTab !== 'estancados' && countEstancados > 0 ? '#38bdf8' : undefined
          }}
        >
          ❄️ Leads Estancados (+5d) ({countEstancados})
        </button>
      </div>

      {/* Table controls (Search and Filters) */}
      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search className="search-icon-svg" size={18} />
          <input
            type="text"
            placeholder="Buscar por empresa, contacto, próxima acción, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todos">Todos los Estados</option>
          <option value="prospecto">1. Prospecto</option>
          <option value="llamado">2. Contactado</option>
          <option value="cita_agendada">3. Cita Agendada</option>
          <option value="presentacion_realizada">4. Demo Realizada</option>
          <option value="cerrado_ganado">5. Cerrado Ganado</option>
          <option value="cerrado_perdido">6. Cerrado Perdido</option>
        </select>

        <select
          className="select-filter"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="todos">Todos los Planes</option>
          <option value="plan_30">Plan 30</option>
          <option value="plan_80">Plan 80</option>
          <option value="plan_200">Plan 200</option>
          <option value="plan_500">Plan 500</option>
          <option value="plan_1200">Plan 1200</option>
        </select>

        <select
          className="select-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="todos">Todos los Tipos</option>
          <option value="coach">Entrenador (Coach)</option>
          <option value="nutricionista">Nutricionista</option>
          <option value="gimnasio">Gimnasio</option>
          <option value="tienda_suplementos">Tienda Suplementos</option>
          <option value="herbalife_distribuidor">Distribuidor Herbalife</option>
          <option value="otro">Otro</option>
        </select>

        <button className="btn btn-primary" onClick={onAddNewLead}>
          <Plus size={16} /> Nuevo Lead
        </button>
      </div>

      {/* Table view */}
      <div className="table-panel">
        {filteredLeads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={28} />
            </div>
            <h3>No se encontraron prospectos</h3>
            <p>Prueba ajustando los filtros de búsqueda o agrega un nuevo prospecto comercial.</p>
            <button className="btn btn-primary" onClick={onAddNewLead}>
              <Plus size={16} /> Crear Prospecto
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Empresa / Contacto</th>
                  <th>Tipo Cliente</th>
                  <th>Plan Objetivo</th>
                  <th>Estado</th>
                  <th>Valor Estimado</th>
                  <th>Contacto directo</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => {
                  const { action, actionDate, lostReasonLabel } = parseLeadNotes(lead.notes);
                  const waUrl = getWhatsAppUrl(lead.phone, lead.contact_name || lead.business_name);
                  
                  const daysInactive = getDaysInactive(lead.last_interaction);
                  const isStale = daysInactive >= 5 && !['cerrado_ganado', 'cerrado_perdido'].includes(lead.status);
                  const isOverdue = isDateOverdue(actionDate);
                  const isToday = isDateToday(actionDate);

                  return (
                    <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="td-name">{lead.business_name}</span>
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
                            >
                              <Snowflake size={10} /> +{daysInactive}d
                            </span>
                          )}
                        </div>
                        <div className="td-subtitle">{lead.contact_name}</div>
                        {action && (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '2px', 
                            marginTop: '6px',
                            color: isOverdue ? '#ef4444' : isToday ? '#f97316' : 'hsl(var(--color-presentacion))',
                            fontSize: '0.8rem',
                            fontWeight: 500 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Target size={12} />
                              <span>Próxima: {action}</span>
                            </div>
                            {actionDate && (
                              <div style={{ fontSize: '0.72rem', opacity: 0.85, paddingLeft: '18px', fontWeight: 600 }}>
                                {isOverdue ? '⚠️ Vencido: ' : isToday ? '⏰ HOY: ' : '📅 '}
                                {formatDateTimeDisplay(actionDate)}
                              </div>
                            )}
                          </div>
                        )}
                        {lead.status === 'cerrado_perdido' && lostReasonLabel && (
                          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-perdido))', fontStyle: 'italic', marginTop: '4px' }}>
                            Motivo: {lostReasonLabel}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-client ${clientTypeBadgeClasses[lead.client_type] || 'badge-otro'}`}>
                          {clientTypeLabels[lead.client_type] || lead.client_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {planLabels[lead.target_plan] || lead.target_plan}
                        </div>
                      </td>
                      <td>
                        <div className={`status-indicator status-${lead.status}`}>
                          {statusLabels[lead.status] || lead.status}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {formatCurrency(lead.estimated_value)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                          {lead.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))', flexWrap: 'wrap' }}>
                              <Phone size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                              <span>{lead.phone}</span>
                              {lead.phone && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenWhatsApp) onOpenWhatsApp(lead);
                                    else if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
                                  }}
                                  className="btn-whatsapp-sm"
                                  title="Opciones de WhatsApp"
                                  style={{ border: 'none', cursor: 'pointer' }}
                                >
                                  <MessageCircle size={12} />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                            </div>
                          )}
                          {lead.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))' }}>
                              <Mail size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {!lead.phone && !lead.email && (
                            <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>Sin datos</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
