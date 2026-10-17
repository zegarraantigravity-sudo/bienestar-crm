import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Video,
  Filter
} from 'lucide-react';
import { isDateToday } from '../lib/utils';

export default function CalendarView({ leads, onSelectLead, onOpenWhatsApp }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'cita_agendada' | 'presentacion_realizada'

  // Extract leads that have a valid next_action_date
  const scheduledLeads = useMemo(() => {
    return leads.map(lead => {
      let nextDate = null;
      let nextAction = '';
      try {
        const notesObj = JSON.parse(lead.notes || '{}');
        if (notesObj && typeof notesObj === 'object') {
          nextDate = notesObj.next_action_date || null;
          nextAction = notesObj.next_action || '';
        }
      } catch (e) {
        nextDate = null;
      }
      return {
        ...lead,
        scheduledDate: nextDate ? new Date(nextDate) : null,
        scheduledAction: nextAction
      };
    }).filter(item => item.scheduledDate && !isNaN(item.scheduledDate.getTime()))
      .filter(item => {
        if (filterStatus === 'all') return true;
        return item.status === filterStatus;
      });
  }, [leads, filterStatus]);

  // Calendar navigation
  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Days in month grid
  const daysInMonthGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Adjust starting day (Monday = 0, Sunday = 6)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        month: month - 1,
        year: year,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: year,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  }, [year, month]);

  // Today's events summary
  const todayEvents = useMemo(() => {
    const today = new Date();
    return scheduledLeads.filter(lead => {
      const d = lead.scheduledDate;
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    });
  }, [scheduledLeads]);

  // Get events for a specific day
  const getEventsForDay = (date) => {
    return scheduledLeads.filter(lead => {
      const d = lead.scheduledDate;
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'cita_agendada':
        return { label: 'Zoom Agendado', bg: '#EDE9FE', color: '#6D28D9' };
      case 'presentacion_realizada':
        return { label: 'Demo Realizada', bg: '#FEF3C7', color: '#D97706' };
      case 'cerrado_ganado':
        return { label: 'Ganado', bg: '#D1FAE5', color: '#059669' };
      default:
        return { label: 'Seguimiento', bg: '#E0F2FE', color: '#0284C7' };
    }
  };

  return (
    <div className="calendar-view-container">
      {/* Top Controls & Metrics Bar */}
      <div className="calendar-top-bar">
        <div className="calendar-period-controls">
          <div className="nav-buttons-group">
            <button className="cal-nav-btn" onClick={prevPeriod} title="Periodo anterior">
              <ChevronLeft size={18} />
            </button>
            <button className="cal-nav-btn today-btn" onClick={goToToday}>
              Hoy
            </button>
            <button className="cal-nav-btn" onClick={nextPeriod} title="Periodo siguiente">
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="calendar-period-title">
            {monthNames[month]} <span className="year-number">{year}</span>
          </h2>
        </div>

        <div className="calendar-actions-right">
          {/* Status Filter */}
          <div className="cal-filter-wrapper">
            <Filter size={15} className="filter-icon" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="cal-status-select"
            >
              <option value="all">Todas las Citas ({scheduledLeads.length})</option>
              <option value="cita_agendada">Zooms Agendados</option>
              <option value="presentacion_realizada">Demos Activas</option>
            </select>
          </div>

          {/* View Mode Pills */}
          <div className="cal-view-pills">
            <button 
              className={`pill-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Mes
            </button>
            <button 
              className={`pill-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Body: 2 Columns (Grid + Agenda Sidebar) */}
      <div className="calendar-layout-grid">
        {/* Left/Center: Month Grid */}
        <div className="calendar-grid-card">
          {/* Days of Week Header */}
          <div className="calendar-weekdays-header">
            {dayNames.map((dayName, idx) => (
              <div key={idx} className="calendar-weekday-cell">
                {dayName}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="calendar-month-cells">
            {daysInMonthGrid.map((dayObj, idx) => {
              const dayEvents = getEventsForDay(dayObj.date);
              const isToday = isDateToday(dayObj.date.toISOString());

              return (
                <div 
                  key={idx} 
                  className={`calendar-day-cell ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'current-today' : ''}`}
                >
                  <div className="day-cell-header">
                    <span className={`day-number ${isToday ? 'today-pill' : ''}`}>
                      {dayObj.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="events-count-badge">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Event Chips */}
                  <div className="day-events-list">
                    {dayEvents.slice(0, 3).map((item, eIdx) => {
                      const badge = getStatusBadge(item.status);
                      const timeStr = item.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                      return (
                        <div 
                          key={eIdx}
                          className="calendar-event-chip"
                          style={{ borderLeftColor: badge.color }}
                          onClick={() => onSelectLead(item)}
                          title={`${item.contact_name || item.business_name} - ${timeStr} - ${item.scheduledAction || 'Reunión'}`}
                        >
                          <div className="chip-time">{timeStr}</div>
                          <div className="chip-name">{item.contact_name || item.business_name}</div>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="events-more-chip">
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Today's Appointments & Upcoming Zooms */}
        <div className="calendar-agenda-sidebar">
          <div className="agenda-card">
            <div className="agenda-card-header">
              <div className="agenda-title-wrap">
                <Video size={18} className="agenda-icon" />
                <h3>Citas de Hoy</h3>
              </div>
              <span className="agenda-counter-pill">
                {todayEvents.length}
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <div className="agenda-empty-state">
                <CheckCircle2 size={36} className="empty-icon" />
                <p>No tienes citas programadas para hoy.</p>
                <span className="empty-sub">Usa tus horarios libres para prospección.</span>
              </div>
            ) : (
              <div className="agenda-events-scroll">
                {todayEvents.map((lead, idx) => {
                  const badge = getStatusBadge(lead.status);
                  const timeStr = lead.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <div key={idx} className="agenda-event-card" onClick={() => onSelectLead(lead)}>
                      <div className="event-card-top">
                        <span className="event-badge" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                        <div className="event-time-tag">
                          <Clock size={13} />
                          <span>{timeStr}</span>
                        </div>
                      </div>

                      <div className="event-contact-title">
                        {lead.contact_name || lead.business_name}
                      </div>

                      {lead.scheduledAction && (
                        <p className="event-action-desc">
                          {lead.scheduledAction}
                        </p>
                      )}

                      <div className="event-card-actions">
                        <button 
                          className="action-btn call-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${lead.phone}`);
                          }}
                          title="Llamar"
                        >
                          <Phone size={13} />
                          <span>Llamar</span>
                        </button>
                        <button 
                          className="action-btn wa-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWhatsApp(lead);
                          }}
                          title="WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats / Capacity Card */}
          <div className="agenda-capacity-card">
            <h4>Resumen de Agenda</h4>
            <div className="capacity-stat-row">
              <span className="stat-label">Total Citas en Cartera:</span>
              <span className="stat-value">{scheduledLeads.length}</span>
            </div>
            <div className="capacity-stat-row">
              <span className="stat-label">Zooms Confirmados:</span>
              <span className="stat-value" style={{ color: '#6D28D9' }}>
                {scheduledLeads.filter(l => l.status === 'cita_agendada').length}
              </span>
            </div>
            <div className="capacity-stat-row">
              <span className="stat-label">Demos en Seguimiento:</span>
              <span className="stat-value" style={{ color: '#D97706' }}>
                {scheduledLeads.filter(l => l.status === 'presentacion_realizada').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
