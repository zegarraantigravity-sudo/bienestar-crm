import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

export const lostReasonOptions = [
  { id: 'precio_alto', label: 'Precio elevado / Presupuesto limitado' },
  { id: 'sin_tiempo', label: 'Sin tiempo / Falta de interés' },
  { id: 'competencia', label: 'Usa otro software o solución' },
  { id: 'no_responde', label: 'No responde llamadas ni mensajes' },
  { id: 'otro', label: 'Otro motivo' },
];

export default function LostReasonModal({ isOpen, lead, onClose, onConfirm }) {
  if (!isOpen || !lead) return null;

  const [selectedReason, setSelectedReason] = useState('precio_alto');
  const [customDetail, setCustomDetail] = useState('');

  const handleConfirm = () => {
    const reasonObj = lostReasonOptions.find(r => r.id === selectedReason);
    const reasonLabel = reasonObj ? reasonObj.label : 'Otro motivo';
    const fullReason = customDetail ? `${reasonLabel} (${customDetail})` : reasonLabel;

    onConfirm(fullReason, selectedReason);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'hsla(0, 75%, 55%, 0.15)',
              color: 'hsl(var(--color-perdido))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Motivo de Pérdida del Lead</h2>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{lead.business_name}</span>
            </div>
          </div>
          <button className="btn-icon-only" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
            Por favor indica la razón principal por la que este prospecto se marca como <strong>Cerrado Perdido</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lostReasonOptions.map(opt => (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: selectedReason === opt.id ? 'hsla(0, 75%, 55%, 0.1)' : 'hsl(var(--bg-sidebar))',
                  border: selectedReason === opt.id ? '1px solid hsla(0, 75%, 55%, 0.3)' : '1px solid hsl(var(--border-color))',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: selectedReason === opt.id ? 600 : 400,
                  color: selectedReason === opt.id ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="lost_reason"
                  value={opt.id}
                  checked={selectedReason === opt.id}
                  onChange={() => setSelectedReason(opt.id)}
                  style={{ accentColor: 'hsl(var(--color-perdido))' }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'otro' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>
                Especificar motivo:
              </label>
              <input
                type="text"
                value={customDetail}
                onChange={e => setCustomDetail(e.target.value)}
                placeholder="Ej. Se mudó de ciudad / Cerró el local..."
                className="form-control"
              />
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm}>
            <Check size={16} /> Confirmar Pérdida
          </button>
        </div>
      </div>
    </div>
  );
}
