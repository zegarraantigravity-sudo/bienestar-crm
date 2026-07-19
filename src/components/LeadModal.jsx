import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Phone, Calendar, User, Mail, Briefcase, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LeadModal({ lead, isOpen, onClose, onSave, onDelete }) {
  const isEdit = !!lead;
  
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    client_type: 'coach',
    target_plan: 'prueba_30_creditos',
    status: 'prospecto',
    estimated_value: 0,
    assigned_to: 'Socio Comercial',
  });

  const [notesList, setNotesList] = useState([]);
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
        target_plan: lead.target_plan || 'prueba_30_creditos',
        status: lead.status || 'prospecto',
        estimated_value: lead.estimated_value || 0,
        assigned_to: lead.assigned_to || 'Socio Comercial',
      });

      // Parse JSON notes for timeline
      let parsed = [];
      try {
        parsed = JSON.parse(lead.notes || '[]');
        if (!Array.isArray(parsed)) {
          parsed = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
        }
      } catch (e) {
        parsed = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
      }
      setNotesList(parsed);
    } else {
      setFormData({
        business_name: '',
        contact_name: '',
        email: '',
        phone: '',
        client_type: 'coach',
        target_plan: 'prueba_30_creditos',
        status: 'prospecto',
        estimated_value: 0,
        assigned_to: 'Socio Comercial',
      });
      setNotesList([]);
    }
    setNewNote('');
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_value' ? parseFloat(value) || 0 : value
    }));
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
      const payload = {
        ...formData,
        notes: JSON.stringify(notesList),
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
      alert('Error al guardar el prospecto: ' + error.message);
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
                <label>Teléfono</label>
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
                  <option value="prueba_30_creditos">Prueba 30 Créditos</option>
                  <option value="estandar">Plan Estándar</option>
                  <option value="premium">Plan Premium</option>
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
                <label>Valor Estimado ($ USD)</label>
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
            </div>

            {isEdit && (
              <div className="timeline-section">
                <div className="timeline-header">
                  <h3>Bitácora de Seguimiento</h3>
                </div>
                <div className="timeline-add-box">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Escribe una nueva nota de seguimiento..."
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
