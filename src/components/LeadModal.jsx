import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Phone, Calendar, User, Mail, Briefcase, DollarSign, Target, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getWhatsAppUrl } from '../lib/utils';

const planValues = {
  plan_30: 300,
  plan_80: 600,
  plan_200: 1200,
  plan_500: 2700,
  plan_1200: 6000,
};

export default function LeadModal({ lead, isOpen, onClose, onSave, onDelete }) {
  const isEdit = !!lead;
  
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    client_type: 'coach',
    target_plan: 'plan_30',
    status: 'prospecto',
    estimated_value: 300,
    assigned_to: 'Socio Comercial',
  });

  const [notesList, setNotesList] = useState([]);
  const [nextAction, setNextAction] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        business_name: lead.business_name || '',
        contact_name: lead.contact_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        client_type: lead.client_type || 'coach',
        target_plan: lead.target_plan || 'plan_30',
        status: lead.status || 'prospecto',
        estimated_value: lead.estimated_value || 0,
        assigned_to: lead.assigned_to || 'Socio Comercial',
      });

      // Parse JSON notes and next action
      let parsedTimeline = [];
      let parsedNextAction = '';
      try {
        const notesData = JSON.parse(lead.notes || '[]');
        if (Array.isArray(notesData)) {
          parsedTimeline = notesData;
        } else if (notesData && typeof notesData === 'object') {
          parsedTimeline = notesData.timeline || [];
          parsedNextAction = notesData.next_action || '';
        } else {
          parsedTimeline = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
        }
      } catch (e) {
        parsedTimeline = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
      }
      setNotesList(parsedTimeline);
      setNextAction(parsedNextAction);
    } else {
      setFormData({
        business_name: '',
        contact_name: '',
        email: '',
        phone: '',
        client_type: 'coach',
        target_plan: 'plan_30',
        status: 'prospecto',
        estimated_value: 300,
        assigned_to: 'Socio Comercial',
      });
      setNotesList([]);
      setNextAction('');
    }
    setNewNote('');
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: name === 'estimated_value' ? parseFloat(value) || 0 : value };
      
      // Auto pre-fill estimated value on plan selection change
      if (name === 'target_plan') {
        const defaultVal = planValues[value];
        if (defaultVal !== undefined) {
          updated.estimated_value = defaultVal;
        }
      }
      
      return updated;
    });
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteObj = {
      date: new Date().toISOString(),
      text: newNote.trim()
    };

    const updatedNotes = [noteObj, ...notesList];
    setNotesList(updatedNotes);
    setNewNote('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_name.trim() || !formData.contact_name.trim()) {
      alert('Nombre de empresa y de contacto son requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Package timeline and next action in the notes field
      const notesPayload = JSON.stringify({
        timeline: notesList,
        next_action: nextAction.trim()
      });

      const payload = {
        ...formData,
        notes: notesPayload,
        last_interaction: new Date().toISOString()
      };

      let result;
      if (isEdit) {
        const { data, error } = await supabase
          .from('leads')
          .update(payload)
          .eq('id', lead.id)
          .select();
        
        if (error) throw error;
        result = data[0];
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert([payload])
          .select();
        
        if (error) throw error;
        result = data[0];
      }

      onSave(result);
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error al guardar el prospecto: ' + error.message + '\n\nNOTA: Asegúrate de haber quitado la restricción de planes ejecutando el script ALTER TABLE en tu SQL Editor de Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este prospecto?')) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;
      onDelete(lead.id);
      onClose();
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error al eliminar el prospecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLocalDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  const modalWaUrl = getWhatsAppUrl(formData.phone, formData.contact_name || formData.business_name);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Detalles del Lead' : 'Nuevo Prospecto'}</h2>
          <button className="btn-icon-only" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la Empresa *</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Ej. Gimnasio FitClub"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Persona de Contacto *</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="Ej. Carlos Mendoza"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Teléfono</label>
                  {modalWaUrl && (
                    <a
                      href={modalWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-sm"
                      style={{ margin: 0, padding: '1px 6px', fontSize: '0.75rem' }}
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageCircle size={12} />
                      <span>Abrir WhatsApp</span>
                    </a>
                  )}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+51 987654321"
                  className="form-control"
                />
              </div>


              <div className="form-group">
                <label>Tipo de Cliente</label>
                <select
                  name="client_type"
                  value={formData.client_type}
                  onChange={handleChange}
                  className="form-control select-filter"
                  style={{ width: '100%', minWidth: 'auto' }}
                >
                  <option value="coach">Entrenador (Coach)</option>
                  <option value="nutricionista">Nutricionista</option>
                  <option value="gimnasio">Gimnasio</option>
                  <option value="tienda_suplementos">Tienda de Suplementos</option>
                  <option value="herbalife_distribuidor">Distribuidor Herbalife</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Plan Objetivo</label>
                <select
                  name="target_plan"
                  value={formData.target_plan}
                  onChange={handleChange}
                  className="form-control select-filter"
                  style={{ width: '100%', minWidth: 'auto' }}
                >
                  <option value="plan_30">Plan 30 (S/. 300)</option>
                  <option value="plan_80">Plan 80 (S/. 600)</option>
                  <option value="plan_200">Plan 200 (S/. 1200)</option>
                  <option value="plan_500">Plan 500 (S/. 2700)</option>
                  <option value="plan_1200">Plan 1200 (S/. 6000)</option>
                  
                  {/* Fallback for legacy plans in db check constraints */}
                  <option value="prueba_30_creditos" style={{ display: 'none' }}>Prueba 30 Créditos</option>
                  <option value="estandar" style={{ display: 'none' }}>Plan Estándar</option>
                  <option value="premium" style={{ display: 'none' }}>Plan Premium</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado del Embudo</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control select-filter"
                  style={{ width: '100%', minWidth: 'auto' }}
                >
                  <option value="prospecto">1. Prospecto</option>
                  <option value="llamado">2. Contactado (Llamado)</option>
                  <option value="cita_agendada">3. Cita Agendada</option>
                  <option value="presentacion_realizada">4. Presentación Realizada</option>
                  <option value="cerrado_ganado">5. Cerrado - Ganado</option>
                  <option value="cerrado_perdido">6. Cerrado - Perdido</option>
                </select>
              </div>

              <div className="form-group">
                <label>Valor Estimado (S/. PEN)</label>
                <input
                  type="number"
                  step="0.01"
                  name="estimated_value"
                  value={formData.estimated_value}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="form-control"
                />
              </div>

              <div className="form-group-full">
                <label>Asignado A</label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group-full" style={{ padding: '8px 0', borderTop: '1px solid hsl(var(--border-color))', marginTop: '4px' }}>
                <label style={{ color: 'hsl(var(--color-presentacion))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} /> Próxima Acción Pendiente (¿Qué toca hacer ahora?)
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={e => setNextAction(e.target.value)}
                  placeholder="Ej: Llamar el lunes 9am para confirmar demo de software..."
                  className="form-control"
                  style={{ border: '1px solid hsla(35, 100%, 55%, 0.25)', backgroundColor: 'hsla(35, 100%, 55%, 0.02)' }}
                />
              </div>
            </div>

            {isEdit && (
              <div className="timeline-section">
                <div className="timeline-header">
                  <h3>Bitácora de Seguimiento (Historial)</h3>
                </div>
                <div className="timeline-add-box">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Escribe lo que acaba de suceder (ej: 'Se llamó, no contestó')..."
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAddNote}>
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                <div className="timeline-list">
                  {notesList.length === 0 ? (
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', paddingLeft: '8px' }}>
                      No hay interacciones registradas. Escribe tu primera nota arriba.
                    </div>
                  ) : (
                    notesList.map((item, index) => (
                      <div className={`timeline-item ${index === 0 ? 'recent' : ''}`} key={index}>
                        <div className="timeline-meta">
                          <span className="timeline-date">{formatLocalDate(item.date)}</span>
                        </div>
                        <div className="timeline-content">
                          {item.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isEdit && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ marginRight: 'auto' }}
                onClick={handleDeleteClick}
                disabled={isSubmitting}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={16} /> {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
