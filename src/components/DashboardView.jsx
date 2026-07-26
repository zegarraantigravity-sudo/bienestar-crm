import React, { useState } from 'react';
import { Phone, Calendar, Award, DollarSign, Target, TrendingUp, AlertTriangle, Snowflake, Clock } from 'lucide-react';
import { getDaysInactive, isDateToday, isDateOverdue } from '../lib/utils';
import { lostReasonOptions } from './LostReasonModal';

export default function DashboardView({ leads }) {
  const [monthlyGoal, setMonthlyGoal] = useState(30000);

  const totalLeads = leads.length;
  
  // Calculate funnel counts
  const llamados = leads.filter(l => l.status !== 'prospecto').length;
  const citas = leads.filter(l => ['cita_agendada', 'presentacion_realizada', 'cerrado_ganado', 'cerrado_perdido'].includes(l.status)).length;
  const presentaciones = leads.filter(l => ['presentacion_realizada', 'cerrado_ganado', 'cerrado_perdido'].includes(l.status)).length;
  const ganados = leads.filter(l => l.status === 'cerrado_ganado').length;

  // Calculate percentages
  const tasaContacto = totalLeads > 0 ? ((llamados / totalLeads) * 100) : 0;
  const tasaCita = llamados > 0 ? ((citas / llamados) * 100) : 0;
  const tasaCierre = presentaciones > 0 ? ((ganados / presentaciones) * 100) : 0;

  // Sum estimated values for each stage
  const getStageValue = (stage) => {
    return leads
      .filter(l => l.status === stage)
      .reduce((sum, l) => sum + (parseFloat(l.estimated_value) || 0), 0);
  };

  const stageValues = {
    prospecto: getStageValue('prospecto'),
    llamado: getStageValue('llamado'),
    cita_agendada: getStageValue('cita_agendada'),
    presentacion_realizada: getStageValue('presentacion_realizada'),
    cerrado_ganado: getStageValue('cerrado_ganado'),
    cerrado_perdido: getStageValue('cerrado_perdido'),
  };

  // Pipeline total value
  const totalPipeline = leads.reduce((sum, l) => sum + (parseFloat(l.estimated_value) || 0), 0);

  // Closed sales total
  const totalGanado = stageValues.cerrado_ganado;
  
  // Monthly goal percentage
  const goalPercentage = monthlyGoal > 0 ? Math.min(((totalGanado / monthlyGoal) * 100), 100) : 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  // Find max value in funnel to scale the bar lengths
  const maxStageValue = Math.max(...Object.values(stageValues), 1);

  // Parse notes JSON for lost reasons & health metrics
  const parseNotes = (notesStr) => {
    try {
      const obj = JSON.parse(notesStr);
      if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        return {
          lostReason: obj.lost_reason || 'otro',
          lostReasonLabel: obj.lost_reason_label || 'Otro motivo',
          actionDate: obj.next_action_date || ''
        };
      }
    } catch (e) {}
    return { lostReason: 'otro', lostReasonLabel: 'Otro motivo', actionDate: '' };
  };

  // Lost reasons counts
  const lostLeads = leads.filter(l => l.status === 'cerrado_perdido');
  const lostReasonCounts = {};
  lostLeads.forEach(l => {
    const { lostReason } = parseNotes(l.notes);
    const reasonKey = lostReason || 'otro';
    lostReasonCounts[reasonKey] = (lostReasonCounts[reasonKey] || 0) + 1;
  });

  // Funnel Health counts
  const countStale = leads.filter(l => {
    const days = getDaysInactive(l.last_interaction);
    return days >= 5 && !['cerrado_ganado', 'cerrado_perdido'].includes(l.status);
  }).length;

  const countOverdue = leads.filter(l => {
    const { actionDate } = parseNotes(l.notes);
    return actionDate && isDateOverdue(actionDate) && !['cerrado_ganado', 'cerrado_perdido'].includes(l.status);
  }).length;

  const countToday = leads.filter(l => {
    const { actionDate } = parseNotes(l.notes);
    return actionDate && isDateToday(actionDate) && !['cerrado_ganado', 'cerrado_perdido'].includes(l.status);
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card contacto">
          <div className="metric-header">
            <span className="metric-label">Tasa de Contacto</span>
            <div className="metric-icon-wrapper">
              <Phone size={18} />
            </div>
          </div>
          <div className="metric-value">{tasaContacto.toFixed(1)}%</div>
          <span className="metric-trend" style={{ color: 'hsl(var(--text-secondary))' }}>
            {llamados} de {totalLeads} prospectos
          </span>
        </div>

        <div className="metric-card cita">
          <div className="metric-header">
            <span className="metric-label">Tasa de Citas</span>
            <div className="metric-icon-wrapper">
              <Calendar size={18} />
            </div>
          </div>
          <div className="metric-value">{tasaCita.toFixed(1)}%</div>
          <span className="metric-trend" style={{ color: 'hsl(var(--text-secondary))' }}>
            {citas} citas agendadas
          </span>
        </div>

        <div className="metric-card cierre">
          <div className="metric-header">
            <span className="metric-label">Tasa de Cierre</span>
            <div className="metric-icon-wrapper">
              <Award size={18} />
            </div>
          </div>
          <div className="metric-value">{tasaCierre.toFixed(1)}%</div>
          <span className="metric-trend" style={{ color: 'hsl(var(--text-secondary))' }}>
            {ganados} ganados de {presentaciones} demos
          </span>
        </div>

        <div className="metric-card pipeline">
          <div className="metric-header">
            <span className="metric-label">Valor del Embudo</span>
            <div className="metric-icon-wrapper">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ fontSize: '1.75rem', marginTop: '4px' }}>
            {formatCurrency(totalPipeline)}
          </div>
          <span className="metric-trend" style={{ color: 'hsl(var(--text-secondary))' }}>
            Total proyectado en cartera
          </span>
        </div>
      </div>

      {/* Health & Attention Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{
          backgroundColor: 'hsla(35, 100%, 55%, 0.08)',
          border: '1px solid hsla(35, 100%, 55%, 0.25)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'hsla(35, 100%, 55%, 0.2)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{countToday} Tareas para Hoy / {countOverdue} Vencidas</div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Requieren seguimiento en agenda</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Snowflake size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{countStale} Leads Estancados</div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Sin contacto en los últimos 5 días</div>
          </div>
        </div>
      </div>

      {/* Goal & Funnel Details Grid */}
      <div className="dashboard-grid">
        
        {/* Funnel Stage Breakdown */}
        <div className="dashboard-panel">
          <h2 className="panel-title">Volumen Financiero por Fase</h2>
          
          <div className="funnel-container">
            {[
              { id: 'prospecto', name: '1. Prospecto', color: 'hsl(var(--color-prospecto))' },
              { id: 'llamado', name: '2. Contactado', color: 'hsl(var(--color-llamado))' },
              { id: 'cita_agendada', name: '3. Cita Agendada', color: 'hsl(var(--color-cita))' },
              { id: 'presentacion_realizada', name: '4. Demo Realizada', color: 'hsl(var(--color-presentacion))' },
              { id: 'cerrado_ganado', name: '5. Cerrado Ganado', color: 'hsl(var(--color-ganado))' },
              { id: 'cerrado_perdido', name: '6. Cerrado Perdido', color: 'hsl(var(--color-perdido))' },
            ].map(stage => {
              const val = stageValues[stage.id];
              const pct = (val / maxStageValue) * 100;
              return (
                <div className="funnel-stage-row" key={stage.id}>
                  <span className="funnel-stage-name">{stage.name}</span>
                  <div className="funnel-stage-bar-outer">
                    <div 
                      className="funnel-stage-bar-inner" 
                      style={{ 
                        width: `${Math.max(pct, 4)}%`, 
                        backgroundColor: stage.color,
                        boxShadow: `0 0 10px ${stage.color}20`
                      }}
                    >
                      {pct > 15 && formatCurrency(val)}
                    </div>
                  </div>
                  <span className="funnel-stage-value">
                    {pct <= 15 && formatCurrency(val)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Lost Reasons Breakdown */}
          {lostLeads.length > 0 && (
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid hsl(var(--border-color))' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} style={{ color: 'hsl(var(--color-perdido))' }} /> Motivos de Pérdida de Clientes ({lostLeads.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lostReasonOptions.map(opt => {
                  const count = lostReasonCounts[opt.id] || 0;
                  const pct = lostLeads.length > 0 ? (count / lostLeads.length) * 100 : 0;
                  if (count === 0) return null;

                  return (
                    <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>{opt.label}</span>
                      <span style={{ fontWeight: 700, color: 'hsl(var(--color-perdido))' }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Goal Progress Card */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Meta de Ventas del Mes</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold' }}>META:</span>
              <input
                type="number"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                style={{
                  background: 'hsl(var(--bg-sidebar))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '90px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  textAlign: 'right',
                  color: 'hsl(var(--text-primary))'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '20px 0', gap: '16px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px', borderRadius: '50%', background: `conic-gradient(hsl(var(--color-ganado)) ${goalPercentage * 3.6}deg, hsl(var(--bg-sidebar)) 0deg)`, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}>
              <div style={{ width: '108px', height: '108px', borderRadius: '50%', backgroundColor: 'hsl(var(--bg-card))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={24} style={{ color: 'hsl(var(--color-ganado))', marginBottom: '4px' }} />
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{goalPercentage.toFixed(0)}%</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Completado</span>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Cerrado Ganado:</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{formatCurrency(totalGanado)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Meta Objetivo:</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--text-muted))' }}>{formatCurrency(monthlyGoal)}</span>
              </div>
              <div className="progress-track" style={{ marginTop: '4px' }}>
                <div className="progress-fill" style={{ width: `${goalPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
