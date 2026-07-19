import React, { useState } from 'react';
import { Search, Phone, Mail, Plus, Target } from 'lucide-react';

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
  // legacy
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

export default function LeadTableView({ leads, onSelectLead, onAddNewLead }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [planFilter, setPlanFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    // Parse next action for searching
    let nextActionText = '';
    try {
      const obj = JSON.parse(lead.notes);
      if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        nextActionText = obj.next_action || '';
      }
    } catch (e) {}

    const searchString = `${lead.business_name} ${lead.contact_name} ${lead.phone || ''} ${lead.email || ''} ${nextActionText}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
    const matchesPlan = planFilter === 'todos' || lead.target_plan === planFilter;
    const matchesType = typeFilter === 'todos' || lead.client_type === typeFilter;

    return matchesSearch && matchesStatus && matchesPlan && matchesType;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  const getNextAction = (notesString) => {
    try {
      const obj = JSON.parse(notesString);
      if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        return obj.next_action || '';
      }
    } catch (e) {}
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
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
                  const action = getNextAction(lead.notes);
                  return (
                    <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                      <td>
                        <div className="td-name">{lead.business_name}</div>
                        <div className="td-subtitle">{lead.contact_name}</div>
                        {action && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'hsl(var(--color-presentacion))', marginTop: '6px', fontWeight: 500 }}>
                            <Target size={12} />
                            <span>Próxima: {action}</span>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                          {lead.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))' }}>
                              <Phone size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                              <span>{lead.phone}</span>
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
