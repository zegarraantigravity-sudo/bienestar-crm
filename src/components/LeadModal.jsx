import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Plus, Phone, Calendar, User, Mail, Briefcase, DollarSign, Target, MessageCircle, AlertTriangle, ShieldCheck, Pencil, Check, Paperclip, FileText, Image as ImageIcon, Download, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { lostReasonOptions } from './LostReasonModal';
import { isSuperAdmin, getUserDisplayName, SALES_REPRESENTATIVES } from '../lib/utils';

// Helper: Compress and resize uploaded image for lightweight storage in database
const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({
          name: file.name,
          type: 'image/jpeg',
          data: dataUrl,
          size: `${approxKb} KB`
        });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper: Read document / PDF as Base64 Data URL (up to 3.5MB)
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 3.5 * 1024 * 1024) {
      reject(new Error('El documento no debe exceder los 3.5 MB para garantizar fluidez.'));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const approxKb = Math.round(file.size / 1024);
      resolve({
        name: file.name,
        type: file.type || 'application/pdf',
        data: reader.result,
        size: `${approxKb} KB`
      });
    };
    reader.onerror = (err) => reject(err);
  });
};

const planValues = {
  plan_30: 400,
  plan_80: 700,
  plan_200: 1200,
  plan_500: 2700,
  plan_1200: 6000,
};

export default function LeadModal({ lead, isOpen, onClose, onSave, onDelete, onOpenWhatsApp, userEmail }) {
  const isEdit = !!lead;
  const isAdmin = isSuperAdmin(userEmail);
  const currentUserDisplayName = getUserDisplayName(userEmail);
  
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    client_type: 'coach',
    target_plan: 'plan_30',
    status: 'prospecto',
    estimated_value: 400,
    assigned_to: isAdmin ? 'Alberto Zegarra' : currentUserDisplayName,
  });

  const [notesList, setNotesList] = useState([]);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [lostReason, setLostReason] = useState('precio_alto');
  const [lostReasonLabel, setLostReasonLabel] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // File & Document Attachments state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lightboxFile, setLightboxFile] = useState(null);
  const [activeTimelineTab, setActiveTimelineTab] = useState('timeline');
  const fileInputRef = useRef(null);

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
        assigned_to: lead.assigned_to || (isAdmin ? 'Alberto Zegarra' : currentUserDisplayName),
      });

      // Parse JSON notes, next action, next action date, lost reason
      let parsedTimeline = [];
      let parsedNextAction = '';
      let parsedNextActionDate = '';
      let parsedLostReason = 'precio_alto';
      let parsedLostReasonLabel = '';

      try {
        const notesData = JSON.parse(lead.notes || '[]');
        if (Array.isArray(notesData)) {
          parsedTimeline = notesData;
        } else if (notesData && typeof notesData === 'object') {
          parsedTimeline = notesData.timeline || [];
          parsedNextAction = notesData.next_action || '';
          parsedNextActionDate = notesData.next_action_date || '';
          parsedLostReason = notesData.lost_reason || 'precio_alto';
          parsedLostReasonLabel = notesData.lost_reason_label || '';
        } else {
          parsedTimeline = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
        }
      } catch (e) {
        parsedTimeline = lead.notes ? [{ date: lead.created_at || new Date().toISOString(), text: lead.notes }] : [];
      }

      setNotesList(parsedTimeline);
      setNextAction(parsedNextAction);
      setNextActionDate(parsedNextActionDate);
      setLostReason(parsedLostReason);
      setLostReasonLabel(parsedLostReasonLabel);
    } else {
      setFormData({
        business_name: '',
        contact_name: '',
        email: '',
        phone: '',
        client_type: 'coach',
        target_plan: 'plan_30',
        status: 'prospecto',
        estimated_value: 400,
        assigned_to: isAdmin ? 'Alberto Zegarra' : currentUserDisplayName,
      });
      setNotesList([]);
      setNextAction('');
      setNextActionDate('');
      setLostReason('precio_alto');
      setLostReasonLabel('');
    }
    setNewNote('');
    setSelectedFile(null);
    setLightboxFile(null);
    setActiveTimelineTab('timeline');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [lead, isOpen, userEmail]);

  if (!isOpen) return null;

  // Extract all documents across timeline notes for quick gallery access
  const allDocuments = notesList
    .filter(item => item.file && item.file.data)
    .map((item, idx) => ({
      id: `tl_doc_${idx}`,
      date: item.date,
      noteText: item.text,
      name: item.file.name || 'Archivo',
      type: item.file.type || 'image/jpeg',
      data: item.file.data,
      size: item.file.size || ''
    }));

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      if (file.type.startsWith('image/')) {
        const processed = await compressImage(file);
        setSelectedFile(processed);
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const processed = await readFileAsBase64(file);
        setSelectedFile(processed);
      } else {
        alert('Por favor selecciona una imagen (JPG, PNG, WEBP) o un documento PDF.');
      }
    } catch (err) {
      console.error('File process error:', err);
      alert(err.message || 'Error al procesar el archivo');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    if (!newNote.trim() && !selectedFile) return;

    let defaultText = '';
    if (selectedFile) {
      defaultText = selectedFile.type?.startsWith('image/')
        ? `Comprobante / imagen adjunta: ${selectedFile.name}`
        : `Documento adjunto: ${selectedFile.name}`;
    }

    const noteObj = {
      date: new Date().toISOString(),
      text: newNote.trim() || defaultText,
      file: selectedFile ? { ...selectedFile } : null
    };

    const updatedNotes = [noteObj, ...notesList];
    setNotesList(updatedNotes);
    setNewNote('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteNote = (indexToDelete) => {
    if (window.confirm('¿Deseas eliminar esta nota de la bitácora?')) {
      setNotesList(prev => prev.filter((_, idx) => idx !== indexToDelete));
      if (editingNoteIndex === indexToDelete) {
        setEditingNoteIndex(null);
        setEditingNoteText('');
      }
    }
  };

  const handleStartEditNote = (index, currentText) => {
    setEditingNoteIndex(index);
    setEditingNoteText(currentText);
  };

  const handleSaveEditNote = (index) => {
    if (!editingNoteText.trim()) return;
    setNotesList(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, text: editingNoteText.trim() };
      }
      return item;
    }));
    setEditingNoteIndex(null);
    setEditingNoteText('');
  };

  const handleCancelEditNote = () => {
    setEditingNoteIndex(null);
    setEditingNoteText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_name.trim() || !formData.contact_name.trim()) {
      alert('Nombre de empresa y de contacto son requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find label for lost reason if applicable
      const matchedOpt = lostReasonOptions.find(r => r.id === lostReason);
      const finalLostLabel = formData.status === 'cerrado_perdido' 
        ? (matchedOpt ? matchedOpt.label : lostReasonLabel || 'Otro motivo')
        : '';

      // Package timeline, next action, date and lost reason in notes field
      const notesPayload = JSON.stringify({
        timeline: notesList,
        next_action: nextAction.trim(),
        next_action_date: nextActionDate,
        lost_reason: formData.status === 'cerrado_perdido' ? lostReason : '',
        lost_reason_label: finalLostLabel,
        documents: allDocuments
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Teléfono</label>
                  {formData.phone && onOpenWhatsApp && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(lead ? { ...lead, ...formData } : formData)}
                      className="btn-whatsapp-sm"
                      style={{ margin: 0, padding: '1px 6px', fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                      title="Abrir opciones de WhatsApp"
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
                    </button>
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
                  <option value="plan_30">Plan 30 (S/. 400)</option>
                  <option value="plan_80">Plan 80 (S/. 700)</option>
                  <option value="plan_200">Plan 200 (S/. 1200)</option>
                  <option value="plan_500">Plan 500 (S/. 2700)</option>
                  <option value="plan_1200">Plan 1200 (S/. 6000)</option>
                  
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
                  <option value="presentacion_realizada">4. Demo Realizada</option>
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

              {formData.status === 'cerrado_perdido' && (
                <div className="form-group-full" style={{ backgroundColor: 'hsla(0, 75%, 55%, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid hsla(0, 75%, 55%, 0.2)' }}>
                  <label style={{ color: 'hsl(var(--color-perdido))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> Motivo de Pérdida del Cliente
                  </label>
                  <select
                    value={lostReason}
                    onChange={e => setLostReason(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    {lostReasonOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> Asignado A (Vendedor Responsable)
                </label>
                {isAdmin ? (
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="form-control select-filter"
                    style={{ width: '100%', minWidth: 'auto' }}
                  >
                    {SALES_REPRESENTATIVES.map(rep => (
                      <option key={rep.id} value={rep.name}>
                        {rep.name} {rep.id === 'alberto' ? '(Tú / Super Admin)' : '(Vendedor)'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="assigned_to"
                    value={formData.assigned_to}
                    readOnly
                    className="form-control"
                    style={{ opacity: 0.8, backgroundColor: 'hsl(var(--bg-sidebar))' }}
                  />
                )}
              </div>

              <div className="form-group-full" style={{ padding: '12px 0 0 0', borderTop: '1px solid hsl(var(--border-color))', marginTop: '4px' }}>
                <label style={{ color: 'hsl(var(--color-presentacion))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Target size={14} /> Próxima Acción Pendiente & Fecha Programada
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    placeholder="Ej: Llamar el lunes 9am para confirmar demo..."
                    className="form-control"
                    style={{ border: '1px solid hsla(35, 100%, 55%, 0.25)', backgroundColor: 'hsla(35, 100%, 55%, 0.02)' }}
                  />
                  <input
                    type="datetime-local"
                    value={nextActionDate}
                    onChange={e => setNextActionDate(e.target.value)}
                    className="form-control"
                    style={{ border: '1px solid hsla(35, 100%, 55%, 0.25)', backgroundColor: 'hsla(35, 100%, 55%, 0.02)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="timeline-section">
                <div className="timeline-nav-tabs">
                  <button
                    type="button"
                    className={`timeline-tab-btn ${activeTimelineTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTimelineTab('timeline')}
                  >
                    📝 Bitácora ({notesList.length})
                  </button>
                  <button
                    type="button"
                    className={`timeline-tab-btn ${activeTimelineTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTimelineTab('documents')}
                  >
                    📎 Comprobantes & Archivos {allDocuments.length > 0 && <span className="tab-badge">{allDocuments.length}</span>}
                  </button>
                </div>

                {activeTimelineTab === 'timeline' ? (
                  <>
                    <div className="timeline-add-box">
                      <div className="timeline-input-wrapper">
                        <input
                          type="text"
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder={selectedFile ? `Nota para ${selectedFile.name}...` : "Escribe lo que acaba de suceder (ej: 'Pago de S/ 200')..."}
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className={`btn-attach-clip ${selectedFile ? 'has-file' : ''}`}
                          onClick={() => fileInputRef.current?.click()}
                          title="Adjuntar comprobante o documento (Imagen o PDF)"
                          disabled={isCompressing}
                        >
                          <Paperclip size={16} />
                        </button>
                      </div>

                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={handleAddNote}
                        disabled={isCompressing || (!newNote.trim() && !selectedFile)}
                      >
                        <Plus size={16} /> Agregar
                      </button>
                    </div>

                    {/* Pre-upload chip if file is selected */}
                    {selectedFile && (
                      <div className="selected-file-chip">
                        {selectedFile.type?.startsWith('image/') ? (
                          <img src={selectedFile.data} alt="Vista previa" className="chip-preview-img" />
                        ) : (
                          <FileText size={16} style={{ color: 'hsl(var(--color-llamado))' }} />
                        )}
                        <div className="chip-file-meta">
                          <span className="chip-file-name">{selectedFile.name}</span>
                          <span className="chip-file-size">({selectedFile.size})</span>
                        </div>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={handleRemoveSelectedFile}
                          title="Quitar archivo adjunto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {isCompressing && (
                      <div className="optimizing-hint">
                        ⏳ Optimizando y comprimiendo archivo...
                      </div>
                    )}

                    <div className="timeline-list">
                      {notesList.length === 0 ? (
                        <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', paddingLeft: '8px' }}>
                          No hay interacciones registradas. Escribe tu primera nota arriba o adjunta un comprobante.
                        </div>
                      ) : (
                        notesList.map((item, index) => (
                          <div className={`timeline-item ${index === 0 ? 'recent' : ''}`} key={index}>
                            <div className="timeline-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="timeline-date">{formatLocalDate(item.date)}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {editingNoteIndex !== index && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditNote(index, item.text)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'hsl(var(--text-muted))',
                                        cursor: 'pointer',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title="Editar nota"
                                      onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--text-primary))'}
                                      onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--text-muted))'}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNote(index)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'hsl(var(--text-muted))',
                                        cursor: 'pointer',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title="Eliminar nota"
                                      onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--color-perdido))'}
                                      onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--text-muted))'}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {editingNoteIndex === index ? (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                  value={editingNoteText}
                                  onChange={e => setEditingNoteText(e.target.value)}
                                  className="form-control"
                                  rows={3}
                                  style={{ fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEditNote}
                                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  >
                                    <X size={12} /> Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => handleSaveEditNote(index)}
                                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  >
                                    <Check size={12} /> Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="timeline-content">
                                <div className="timeline-text">{item.text}</div>

                                {/* Attached File Preview inside Timeline Entry */}
                                {item.file && item.file.data && (
                                  item.file.type?.startsWith('image/') || item.file.data?.startsWith('data:image/') ? (
                                    <div
                                      className="timeline-attachment-card image-card"
                                      onClick={() => setLightboxFile(item.file)}
                                      title="Clic para ampliar comprobante en pantalla completa"
                                    >
                                      <img src={item.file.data} alt={item.file.name || 'Comprobante'} className="attachment-thumb" />
                                      <div className="attachment-details">
                                        <div className="attachment-title">
                                          <ImageIcon size={13} />
                                          <span className="truncate">{item.file.name || 'Comprobante'}</span>
                                        </div>
                                        <div className="attachment-sub">
                                          <span>{item.file.size}</span>
                                          <span className="attachment-zoom-hint"><Eye size={12} /> Ampliar</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="timeline-attachment-card doc-card">
                                      <div className="doc-icon-box">
                                        <FileText size={20} />
                                      </div>
                                      <div className="attachment-details">
                                        <span className="attachment-title truncate">{item.file.name || 'Documento PDF'}</span>
                                        <span className="attachment-sub">{item.file.size}</span>
                                      </div>
                                      <a
                                        href={item.file.data}
                                        download={item.file.name || 'documento.pdf'}
                                        className="btn-download-attachment"
                                        title="Descargar archivo"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <Download size={14} /> Descargar
                                      </a>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  /* Documents Gallery Tab */
                  <div className="documents-gallery-view">
                    <div className="documents-upload-bar">
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                        Comprobantes y contratos adjuntos para este cliente:
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          setActiveTimelineTab('timeline');
                          setTimeout(() => fileInputRef.current?.click(), 100);
                        }}
                      >
                        <Paperclip size={14} /> Subir Nuevo Archivo
                      </button>
                    </div>

                    {allDocuments.length === 0 ? (
                      <div className="empty-docs-box">
                        <FileText size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>No hay comprobantes ni archivos adjuntos aún.</p>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          Puedes adjuntar fotos de transferencias o contratos en cualquier momento desde la bitácora o aquí.
                        </span>
                      </div>
                    ) : (
                      <div className="docs-grid">
                        {allDocuments.map((doc, idx) => (
                          <div key={idx} className="doc-grid-card">
                            {doc.type?.startsWith('image/') || doc.data?.startsWith('data:image/') ? (
                              <div
                                className="doc-grid-thumb"
                                onClick={() => setLightboxFile(doc)}
                                title="Clic para ampliar"
                              >
                                <img src={doc.data} alt={doc.name} />
                                <div className="thumb-hover-overlay">
                                  <Eye size={18} />
                                </div>
                              </div>
                            ) : (
                              <div className="doc-grid-pdf-icon">
                                <FileText size={32} />
                                <span>PDF</span>
                              </div>
                            )}

                            <div className="doc-grid-info">
                              <span className="doc-grid-name" title={doc.name}>{doc.name}</span>
                              <span className="doc-grid-date">{formatLocalDate(doc.date)}</span>
                              {doc.noteText && (
                                <span className="doc-grid-note" title={doc.noteText}>
                                  «{doc.noteText}»
                                </span>
                              )}
                              <div className="doc-grid-actions">
                                <a
                                  href={doc.data}
                                  download={doc.name}
                                  className="btn-doc-download"
                                  title="Descargar"
                                >
                                  <Download size={13} /> {doc.size || 'Descargar'}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

        {/* Lightbox Fullscreen Preview for Images */}
        {lightboxFile && (
          <div className="lightbox-overlay" onClick={() => setLightboxFile(null)}>
            <div className="lightbox-modal" onClick={e => e.stopPropagation()}>
              <div className="lightbox-header">
                <div className="lightbox-title-box">
                  <ImageIcon size={16} />
                  <span className="lightbox-filename">{lightboxFile.name || 'Comprobante'}</span>
                  {lightboxFile.size && <span className="lightbox-size">({lightboxFile.size})</span>}
                </div>
                <div className="lightbox-buttons">
                  <a
                    href={lightboxFile.data}
                    download={lightboxFile.name || 'comprobante.jpg'}
                    className="btn-lightbox-download"
                    title="Descargar imagen"
                  >
                    <Download size={15} /> Descargar
                  </a>
                  <button
                    type="button"
                    className="btn-lightbox-close"
                    onClick={() => setLightboxFile(null)}
                    title="Cerrar vista"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="lightbox-image-container">
                <img src={lightboxFile.data} alt={lightboxFile.name || 'Comprobante'} className="lightbox-main-img" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
