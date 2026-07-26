import React, { useState } from 'react';
import { X, Send, MessageCircle, Copy, Check } from 'lucide-react';
import { getWhatsAppUrl, defaultWhatsAppTemplates } from '../lib/utils';

export default function WhatsAppModal({ lead, isOpen, onClose }) {
  if (!isOpen || !lead) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState('primer_contacto');
  const [customText, setCustomText] = useState(
    defaultWhatsAppTemplates[0].getText(lead)
  );
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setCustomText(template.getText(lead));
  };

  const handleSend = () => {
    const waUrl = getWhatsAppUrl(lead.phone, customText);
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } else {
      alert('El prospecto no tiene un número de teléfono válido.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderColor: 'rgba(37, 211, 102, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 211, 102, 0.15)',
              color: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Enviar WhatsApp a {lead.contact_name || lead.business_name}</h2>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{lead.phone || 'Sin número'}</span>
            </div>
          </div>
          <button className="btn-icon-only" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Selecciona una Plantilla Rápida
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {defaultWhatsAppTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: selectedTemplateId === tpl.id ? 'rgba(37, 211, 102, 0.15)' : 'hsl(var(--bg-sidebar))',
                    color: selectedTemplateId === tpl.id ? '#25D366' : 'hsl(var(--text-primary))',
                    border: selectedTemplateId === tpl.id ? '1px solid rgba(37, 211, 102, 0.4)' : '1px solid hsl(var(--border-color))',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>
                Mensaje a Enviar (Puedes editarlo)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#25D366' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="form-control"
              style={{
                backgroundColor: 'hsl(var(--bg-sidebar))',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSend}
            style={{
              backgroundColor: '#25D366',
              color: 'white',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
            }}
          >
            <Send size={16} /> Abrir WhatsApp Web / App
          </button>
        </div>
      </div>
    </div>
  );
}
